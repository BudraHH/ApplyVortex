"""
Agent Forge - Main Entry Point (Updated for Phase 2)
Polls the server for tasks, executes them using Playwright, and reports results.
Supports both SCRAPE and APPLY task types.
Includes agent registration and heartbeat monitoring.
"""
import asyncio
import logging
# --- Import Path Fix ---
# Append the parent directory to sys.path to allow `from agent.X` imports 
# even when running `python main.py` directly from the `agent/` folder.
import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
# -----------------------

import asyncio
import logging
import requests
import argparse
import json
import httpx 
from agent.client import APIClient
from agent.scrapers.executor import ScraperExecutor
from agent.scrapers.linkedin import LinkedInScraper
from agent.scrapers.naukri import NaukriScraper
from agent.core.state_manager import state_manager
from agent.core.state_manager import state_manager
from agent.core.browser_service import browser_service
from agent.services.ai.resume_scorer import resume_scoring_service
from agent.services.ai.resume_parser import resume_parsing_service
from agent.utils.pdf_utils import extract_text_from_pdf

# --- Environment Setup for Linux/Flet ---
import platform
if platform.system() == "Linux":
    # Flet on Linux requires libmpv.so.1. On some distros (Ubuntu 24.04), 
    # only libmpv.so.2 is available. We assume a local symlink exists in ./libs
    # and add it to LD_LIBRARY_PATH so the Flet subprocess can find it.
    current_dir = os.path.dirname(os.path.abspath(__file__))
    libs_dir = os.path.join(current_dir, "libs")
    if os.path.exists(libs_dir):
        existing_ld = os.environ.get("LD_LIBRARY_PATH", "")
        if libs_dir not in existing_ld:
            os.environ["LD_LIBRARY_PATH"] = f"{libs_dir}:{existing_ld}"
# ----------------------------------------

from agent.handlers.applier import ApplicationHandler

from config import settings

# Try to import PyWebView for GUI
try:
    import webview
    from agent.webview_gui import AgentWebViewGUI, run_gui_with_agent
    HAS_GUI = True
except ImportError:
    HAS_GUI = False


# Configure logging
# Configure logging
logging.basicConfig(
    level=logging.INFO, # Force INFO level for clean output
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
# reduce noise from libraries
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("flet").setLevel(logging.WARNING)
logging.getLogger("asyncio").setLevel(logging.WARNING)

logger = logging.getLogger("AgentForge")


async def download_resume(client: APIClient, save_path: str = "resume.pdf") -> str:
    """Download user resume."""
    try:
        logger.info("Downloading user resume...")
        url = f"{client.base_url}/agent-forge/resume"
        response = client.session.get(url)
        if response.status_code == 200:
            resume_data = response.json()
            file_url = resume_data.get("file_url")
            if file_url:
                resume_response = requests.get(file_url)
                if resume_response.status_code == 200:
                    with open(save_path, 'wb') as f:
                        f.write(resume_response.content)
                    logger.info(f"Resume downloaded to: {save_path}")
                    return save_path
        logger.error("Failed to download resume")
        return None
    except Exception as e:
        logger.error(f"Error downloading resume: {e}")
        return None

async def execute_discovery_logic(client, payload, task_id, gui=None):
    """Phase 1: Discovery (Shallow Scrape + Match Scoring)."""
    portal = payload.get("portal")
    keywords = payload.get("keywords")
    location = payload.get("location", "")
    
    if isinstance(location, str) and ',' in location:
        location = [l.strip() for l in location.split(',') if l.strip()]
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(',') if k.strip()]

    async def check_cancelled():
        t = client.get_task(task_id)
        return t and t.get("status") == "cancelled"

    async def on_progress(batch):
        if batch:
            # STAGE 1: SHALLOW SYNC (The "Lead")
            # We do NOT score here. We just sync the basic job details to register existence.
            # Scoring happens in Phase 2 (Enrichment) when we have the full description.
            client.sync_jobs(task_id, batch)

    if portal and portal.lower() == 'linkedin':
        scraper = LinkedInScraper()
        jobs = await scraper.scrape(
            keywords, location, 
            date_posted=payload.get("date_posted"),
            experience_level=payload.get("experience"),
            job_type=payload.get("job_type"),
            work_mode=payload.get("work_mode"),
            check_cancelled=check_cancelled, 
            on_progress=on_progress
        )
    elif portal and portal.lower() == 'naukri':
        scraper = NaukriScraper()
        jobs = await scraper.scrape(
            keywords, location, 
            date_posted=payload.get("date_posted"),
            min_salary=payload.get("min_salary"),
            check_cancelled=check_cancelled, 
            on_progress=on_progress
        )
    else:
        # Fallback to generic executor
        executor = ScraperExecutor(headless=settings.HEADLESS, debug=settings.DEBUG)
        blueprint = client.get_blueprint(portal)
        search_term = keywords[0] if isinstance(keywords, list) else keywords
        search_url = f"https://{blueprint.get('domain')}/jobs/search/?keywords={search_term}"
        jobs = await executor.scrape(search_url, blueprint)

    return jobs

async def execute_enrichment_logic(client, jobs, task_id, gui=None):
    """Phase 2: Enrichment (Deep Scrape + Final Scoring)."""
    from agent.scrapers.linkedin_deep_scraper import deep_scraper
    profile = state_manager.get_full_profile() or state_manager.get_user_profile()
    profile_context = json.dumps(profile) if profile else ""

    # 1. Batch Check Status
    portal = jobs[0].get("portal_slug", "linkedin") if jobs else "linkedin"
    external_ids = [str(j.get("external_id")) for j in jobs if j.get("external_id")]
    
    logger.info(f"Checking status for {len(external_ids)} jobs on server...")
    status_map = client.check_jobs_status(portal, external_ids)
    
    # 2. Process
    for i, job in enumerate(jobs):
        ext_id = str(job.get("external_id"))
        job_status = status_map.get(ext_id, {})
        
        # SKIP if already deep scraped
        if job_status.get("exists") and job_status.get("deep_scraped"):
            logger.info(f"Skipping deep scrape for {ext_id} - Already enriched.")
            # We might still want to emit a fake 'progress' update or ensure it's in the current task results
            # For now, we skip the heavy lifting
            continue
            
        job_url = job.get("job_url") or job.get("apply_url")
        if job_url:
            if i > 0: await asyncio.sleep(6) # Rate limit
            
            # Deep Scrape
            enriched = await deep_scraper.scrape_job_details(job_url)
            
            if enriched:
                job.update(enriched)
                
                # STAGE 2: LOCAL INTELLIGENCE (SCORING)
                # We use asyncio.to_thread to prevent blocking the GUI during 7B model inference
                score_result = await asyncio.to_thread(
                    resume_scoring_service.score_job, 
                    job.get("description", ""),
                    profile_context,
                    job.get("title", ""),
                    job.get("company", "")
                )
                if score_result:
                    job.update(score_result) # Merge score, reasoning, etc.
                
                # STAGE 3: THE EFFICIENCY GATE (Auto-Reject)
                match_score = score_result.get("match_score", 0)
                
                # STRICTER FILTER: Only keep Good+ matches (70+)
                if match_score < 70:
                    # Case A: JUNK (Auto-Reject)
                    logger.info(f"Auto-Rejecting Job {ext_id} (Score: {match_score})")
                    payload = {
                        "user_status": {
                            "status": "AUTO_REJECTED",
                            "application_status": 3 # FAILED
                        },
                        "job_analysis": {
                            "match_score": match_score,
                            "reasoning": score_result.get("reasoning"),
                            "missing_skills": score_result.get("missing_skills")
                        },
                        "job_data": {} # Empty to save bandwidth
                    }
                else:
                    # Case B: VIABLE (Match)
                    logger.info(f"Job {ext_id} is viable (Score: {match_score})")
                    payload = {
                        "user_status": {
                            "status": "MATCHED",
                            "application_status": 0 # NOT APPLIED
                        },
                        "job_analysis": {
                            "match_score": match_score,
                            "reasoning": score_result.get("reasoning"),
                            "missing_skills": score_result.get("missing_skills"),
                            "skill_gap_recommendations": score_result.get("skill_gap_recommendations")
                        },
                        "job_data": {
                            "description": job.get("description"),
                            "requirements": job.get("requirements"),
                            "responsibilities": job.get("responsibilities"),
                            "is_easy_apply": job.get("is_easy_apply"),
                            "job_post_url": job.get("job_post_url"),
                            "seniority_level": job.get("seniority_level")
                        }
                    }

                # Sync the Decision
                try:
                    # We use the specialized endpoint for partial/full updates
                    client.sync_enriched_job(ext_id, payload)
                except Exception as e:
                    logger.error(f"Failed to sync enrichment for {ext_id}: {e}")
    return jobs

async def process_task(client: APIClient, task: dict, gui=None):
    """Process a single task."""
    task_id = task.get("id")
    task_type = task.get("task_type")
    payload = task.get("payload", {})

    # Handle Integer Task Types (from Server Enum)
    if task_type == 1:
        task_type = "SCRAPE"
    elif task_type == 2:
        task_type = "AUTO_APPLY"
    elif task_type == 3:
        task_type = "APPLY"
    elif task_type == 4 or task_type == 0:
        task_type = "PARSE_RESUME"
    
    # Log Task Type (Readable)
    logger.info(f"Processing Task {task_id}: {task_type}")
    if gui:
        await gui.add_log(f"Received Task: {task_type}", type="task")

    try:
        if task_type in ["SCRAPE", "AUTO_APPLY"]:
            # 1. Discovery
            jobs = await execute_discovery_logic(client, payload, task_id, gui)
            
            # 2. Enrichment (Only for SCRAPE tasks - Universal Enrichment)
            if task_type == "SCRAPE":
                jobs = await execute_enrichment_logic(client, jobs, task_id, gui)

            # 3. Report Completion
            result_payload = {"jobs": jobs, "count": len(jobs)}
            client.submit_result(task_id, "COMPLETED", data=result_payload)

            # 4. Trigger Cycle if AUTO_APPLY
            if task_type == "AUTO_APPLY":
                await execute_application_cycle(client, gui)
            
        elif task_type in ["apply-job", "APPLY", "APPLY_JOB", 3]:
            # Manual Apply: User clicked "Apply" on a specific job in dashboard
            logger.info(f"Manual Apply Task Received: {task_id}")
            if gui:
                await gui.add_log(f"Manual Apply: {payload.get('job_title', 'Job')}...", type="info")

            job_id = payload.get("job_id")
            job_url = payload.get("job_url")
            
            if not job_url:
                error_msg = "Missing job_url in APPLY task payload"
                logger.error(error_msg)
                client.submit_result(task_id, "FAILED", error_log=error_msg)
                return
            
            # Construct job data object for AutoApplyHandler
            job_data = {
                "id": job_id,
                "job_id": job_id,
                "job_url": job_url,
                "title": payload.get("job_title", "Unknown Job"),
                "company": payload.get("company", "Unknown Company")
            }
            
            # Download base resume
            resume_path = await download_resume(client, "temp_resume.pdf")
            if not resume_path:
                error_msg = "Failed to download base resume"
                logger.error(error_msg)
                client.submit_result(task_id, "FAILED", error_log=error_msg)
                return
            
            # Get user profile
            user_profile = state_manager.get_full_profile()
            if not user_profile:
                user_profile = payload.get("user_profile", {})
            
            # Execute using AutoApplyHandler (same as Auto Apply workflow)
            from agent.handlers.auto_apply_handler import AutoApplyHandler
            auto_applier = AutoApplyHandler(client)
            
            try:
                await auto_applier.execute_single_application(job_data, resume_path, user_profile)
                client.submit_result(task_id, "COMPLETED", data={"job_id": job_id, "applied": True})
                logger.info(f"Manual Apply Completed: {job_id}")
                if gui:
                    await gui.add_log(f"Application Success!", type="success")
                    await gui.update_apps_count(1)
            except Exception as e:
                error_msg = f"Application failed: {str(e)}"
                logger.error(error_msg, exc_info=True)
                client.submit_result(task_id, "FAILED", error_log=error_msg)
                if gui:
                    await gui.add_log(f"Application Failed: {str(e)}", type="error")
            finally:
                # Cleanup base resume
                if resume_path and os.path.exists(resume_path):
                    os.remove(resume_path)
                # Cleanup any tailored resume
                tailored_path = f"tailored_{job_id}.pdf"
                if os.path.exists(tailored_path):
                    os.remove(tailored_path)
            
            
            
        elif task_type in ["PARSE_RESUME", 4, 0]:
            if gui: await gui.add_log("Parsing Resume with Local AI...", type="info")
            
            resume_url = payload.get("file_url")
            resume_text = payload.get("resume_text")
            
            # 1. Download if text is missing
            if not resume_text and resume_url:
                try:
                    # Use Async Client to prevent GUI freeze
                    async with httpx.AsyncClient() as http_client:
                        r = await http_client.get(resume_url, timeout=30.0)
                        
                    if r.status_code == 200:
                        # Extract text from raw bytes
                        resume_text = extract_text_from_pdf(r.content)
                    else:
                        error_msg = f"Download failed with status {r.status_code}"
                        logger.error(error_msg)
                        if gui: await gui.add_log(error_msg, type="error")
                        
                except Exception as e:
                    logger.error(f"Download exception: {e}")
                    if gui: await gui.add_log(f"Download error: {str(e)}", type="error")

            # 2. Process with Qwen AI
            if resume_text:
                try:
                    # OPTIMIZATION: Run AI inference in a separate thread to prevent blocking the main event loop
                    # detailed resume parsing can take 10-30s on local hardware.
                    parsed_data = await asyncio.to_thread(resume_parsing_service.parse_resume, resume_text)
                    
                    # Submit Results
                    client.submit_result(task_id, "COMPLETED", data=parsed_data)
                    logger.info(f"Task {task_id} completed. Resume parsed.")
                    if gui: await gui.add_log("Resume Parsing Completed!", type="success")
                    
                except Exception as e:
                    logger.error(f"AI Parsing Failed: {e}")
                    client.submit_result(task_id, "FAILED", error_log=str(e))
                    if gui: await gui.add_log(f"Parsing failed: {str(e)}", type="error")
            else:
                client.submit_result(task_id, "FAILED", error_log="No resume text extracted or file found")
                if gui: await gui.add_log("Failed: Empty resume content", type="error")

        else:
            logger.warning(f"Unknown task type: {task_type}")
            client.submit_result(task_id, "FAILED", error_log=f"Unknown task type: {task_type}")

    except Exception as e:
        logger.error(f"Task execution failed: {e}", exc_info=True)
        if gui:
            await gui.add_log(f"Execution Error: {str(e)}", type="error")
        client.submit_result(task_id, "FAILED", error_log=str(e))

async def heartbeat_loop(client: APIClient, gui=None):
    """Background heartbeat."""
    while True:
        try:
            if client.send_heartbeat():
                if gui: await gui.update_status(online=True)
            else:
                if gui: await gui.update_status(online=False)
            await asyncio.sleep(30)
        except Exception as e:
            logger.debug(f"Heartbeat failed: {e}")
            if gui: await gui.update_status(online=False)
            await asyncio.sleep(10)


# --------------------------------------------------------------------------
# REDEFINED WORKFLOW: Phase 1 (Scrape) then Phase 2 (Apply)
# --------------------------------------------------------------------------

async def execute_application_cycle(client: APIClient, gui=None):
    """Phase 2: Check for unapplied jobs and apply to them."""
    # 1. Get Unapplied Jobs
    unapplied = client.get_unapplied_jobs(limit=10) # Process in batches
    if not unapplied:
        # logger.debug("No unapplied jobs found.")
        return

    logger.info(f"Phase 2: Found {len(unapplied)} unapplied jobs. Starting application cycle...")
    print(f"\n>>> [PHASE 2] Starting Application Cycle for {len(unapplied)} jobs...\n")
    if gui: await gui.add_log(f"Phase 2: {len(unapplied)} jobs to apply.", type="info")

    # Initialize new AutoApplyHandler (Universal Coverage)
    from agent.handlers.auto_apply_handler import AutoApplyHandler
    auto_applier = AutoApplyHandler(client)

    for job in unapplied:
        try:
            job_id = job.get("id")
            job_url = job.get("job_url")
            
            title = job.get('title', 'Unknown Job')
            company = job.get('company', 'Unknown Company')
            print(f"   --> Processing: {title} @ {company}")
            
            logger.info(f"Applying to: {title} at {company}")
            if gui: await gui.add_log(f"Applying: {job.get('title')}...", type="info")

            # 2. Download Resume (Base)
            resume_path = await download_resume(client)
            if not resume_path:
                logger.error("Skipping application: Resume download failed.")
                continue

            # 3. Apply using AutoApplyHandler (rtrvr.ai level - 99% Coverage)
            user_profile = state_manager.get_full_profile()
            
            # Execute Application (Handler determines Easy Apply / ATS / Direct)
            await auto_applier.execute_single_application(job, resume_path, user_profile)
            
            # Cleanup
            if resume_path and os.path.exists(resume_path):
                os.remove(resume_path)
            
            # Note: Reporting is handled inside execute_single_application via _report_result
            if gui: 
                await gui.update_apps_count(1) # Optimistic update for GUI stats

        except Exception as e:
            logger.error(f"Error executing application for job {job.get('id')}: {e}")

async def agent_loop(client: APIClient, gui=None):
    """
    Main Loop:
    1. Independent Polling for 'Manual' server tasks (legacy/direct tasks).
    2. Autonomous Phase 1 (Scraping) based on Active Blueprints.
    3. Autonomous Phase 2 (Application) for pending jobs.
    """
    # ... Login Logic ...
    login_retry_delay = 5
    while not client.login():
        logger.error(f"Agent login failed. Retrying in {login_retry_delay}s...")
        if gui: await gui.add_log(f"Login Failed! Retrying in {login_retry_delay}s...", type="error")
        await asyncio.sleep(login_retry_delay)
        login_retry_delay = min(login_retry_delay * 2, 60)

    if gui:
        await gui.add_log("Login Successful!", type="success")
        await gui.update_status(online=True)
 
    client.register_agent()
    asyncio.create_task(heartbeat_loop(client, gui))
    
    # --- FORCE FULL PROFILE SYNC ON STARTUP ---
    # Clear previous cache (optional as save overwrites, but good for hygiene)
    # state_manager.clear_profile_cache() # Not implemented in StateManager yet, but save overwrites.
    
    logger.info("Performing startup profile sync...")
    print(">>> [STARTUP] Syncing latest User Profile data from server...")
    if gui: await gui.add_log("Syncing Profile Data...", type="info")
    
    try:
        # 1. Fetch User Data (Basic)
        basic_profile = client.get_user_profile()
        if basic_profile:
            state_manager.save_user_data(basic_profile)
            
        # 2. Fetch Full Profile (Edu, Exp, etc.)
        full_profile = client.get_full_user_profile()
        if full_profile:
            state_manager.save_full_profile(full_profile)
            logger.info(f"✅ Full Profile Cached: {len(full_profile.get('experiences', []))} experiences, {len(full_profile.get('educations', []))} educations.")
            if gui: await gui.add_log("Profile Sync Complete!", type="success")
        else:
            logger.warning("Failed to fetch full profile on startup.")
            if gui: await gui.add_log("Profile Sync Failed (Network?)", type="warning")
            
    except Exception as e:
        logger.error(f"Startup profile sync failed: {e}")
        if gui: await gui.add_log(f"Profile Sync Error: {e}", type="error")
    # ------------------------------------------
    
    logger.info("Agent workflow started: Polling & Autonomous Modes Active.")

    while True:
        try:
            if gui and not gui.is_active:
                await asyncio.sleep(1)
                continue
            
            # Log polling activity as requested
            logger.info("Polling for pending tasks...")
            if gui: await gui.add_log("Polling for pending tasks...", type="info")
            
            # --- 1. Manual Task Polling (Legacy/User Triggered via UI 'Run' button) ---
            # Even if we have autonomous mode, we still honor the explicit "Run" tasks 
            # created by the UI to trigger scraping immediately.
            tasks = client.get_pending_tasks()
            if tasks:
                print(f"\n>>> [PHASE 1] Found {len(tasks)} manual scraping tasks. Starting...")
                logger.info(f"Manual Task: Found {len(tasks)} pending tasks.")
                # We use create_task to run these in background so we don't block the loop
                # This allows multiple blueprints to run concurrently!
                for task in tasks:
                    asyncio.create_task(process_task(client, task, gui))
            
            # --- 2. Phase 2: Application Cycle ---
            # We check for unapplied jobs periodically
            # We await this because we can't apply to multiple jobs safely (Playwright session conflicts)
            await execute_application_cycle(client, gui)

            # Wait before next cycle
            await asyncio.sleep(settings.POLL_INTERVAL)

        except Exception as e:
            logger.error(f"Loop error: {e}")
            await asyncio.sleep(10)


async def perform_initial_setup(client: APIClient):
    """Interactive First Run Setup."""
    print("\n" + "="*60)
    print("🚀 FIRST RUN DETECTED")
    print("For the Agent to work, you need to link your accounts.")
    print("A browser window will open. Please log in to:")
    print("  1. LinkedIn")
    print("  2. Naukri (Optional)")
    print("  3. Your Email Provider (Gmail/Outlook)")
    print("="*60 + "\n")
    
    # Sync User Data
    try:
        profile = client.get_user_profile()
        if profile:
            state_manager.save_user_data(profile)
            print("✅ User Profile synced.")
        
        # New: Full Profile Sync
        full_profile = client.get_full_user_profile()
        if full_profile:
            state_manager.save_full_profile(full_profile)
            print("✅ Full Profile Data synced (Experience, Education, etc.).")
    except Exception as e:
        logger.error(f"Failed to sync profile: {e}")

    # Launch Browser
    print("Launching browser for authentication...")
    await browser_service.initialize(headless=False)
    context, page = await browser_service.create_session()
    
    try:
        await page.goto("https://www.linkedin.com/login")
        print("Browser opened to LinkedIn.")
    except Exception as e:
        print(f"Browser navigation error: {e}")

    print("\n" + "!"*60) 
    print("PLEASE LOG IN TO YOUR ACCOUNTS IN THE OPENED BROWSER.")
    print("Once you are logged in, come back here.")
    print("!"*60 + "\n")
    
    # Wait for user input
    try:
        await asyncio.get_event_loop().run_in_executor(None, input, "Press ENTER here once you have successfully logged in... ")
    except Exception:
        pass # Handle potential input issues
    
    print("Saving session...")
    await browser_service.save_session(context)
    print("✅ Session saved! You can close the browser now if you like.")
    await browser_service.cleanup()

async def check_first_run(client: APIClient):
    """Check if session exists, else run setup."""
    session_exists = os.path.exists(state_manager.get_session_path())
    
    if not session_exists:
        await perform_initial_setup(client)
    else:
        # Silent sync
        try:
            profile = client.get_user_profile()
            if profile:
                state_manager.save_user_data(profile)
            
            full_profile = client.get_full_user_profile()
            if full_profile:
                state_manager.save_full_profile(full_profile)
                logger.info("Silent sync of full profile completed.")
        except Exception:
            pass

async def main():
    """Main Entry Point."""
    # Parse Args
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-gui", action="store_true")
    args = parser.parse_args()

    client = APIClient()

    # Check First Run (Before GUI or Headless loop)
    if not args.no_gui:
        # In GUI mode, we currently rely on console for first run.
        pass 
    
    try:
        await check_first_run(client)
    except Exception as e:
        logger.error(f"First run check failed: {e}")

    # GUI Mode
    if HAS_GUI and not args.no_gui:
        print("Initializing GUI Mode...")
        gui = AgentGUI(client.agent_id, settings.SERVER_URL)
        
        async def on_startup():
            # --- AI Bootstrap Check ---
            try:
                from agent.utils.ai_bootstrap import AIBootstrap
                bootstrap = AIBootstrap(gui)
                await bootstrap.run_checks()
            except Exception as e:
                logger.error(f"AI Bootstrap failed: {e}")
                await gui.add_log(f"AI Setup Error: {e}", type="error")
            # --------------------------
            
            await agent_loop(client, gui)

        # Flet async app
        await ft.app_async(target=gui.main)
        
        # Note: In Flet async, usually you start background tasks inside the `gui.main` function 
        # using `page.run_task(agent_loop)`. 
        # Since I can't edit gui.py, we run them side-by-side using gather if the above failed.
        # But wait, `ft.app_async` blocks. 
        # So we MUST start the agent loop as a task BEFORE awaiting app_async, OR use gather.
        
    else:
        # Headless Mode
        print("Initializing Headless Mode...")
        await agent_loop(client, None)

if __name__ == "__main__":
    # Parse Args
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-gui", action="store_true")
    args = parser.parse_args()

    client = APIClient()
    
    if args.no_gui or not HAS_GUI:
        # Headless Mode
        print("Initializing Headless Mode...")
        async def headless_entry():
            # Bypass interactive check to avoid blocking. Session is assumed to exist.
            # await check_first_run(client) 
            
            # --- AI Bootstrap Check ---
            try:
                from agent.utils.ai_bootstrap import AIBootstrap
                bootstrap = AIBootstrap(None) # Headless
                await bootstrap.run_checks()
            except Exception as e:
                logger.error(f"AI Setup Error: {e}")
            # --------------------------

            try:
                # Attempt silent sync anyway
                profile = client.get_user_profile()
                if profile:
                    state_manager.save_user_data(profile)
            except:
                pass
                
            try:
                await agent_loop(client, None)
            except Exception as e:
                import traceback
                error_msg = f"CRITICAL ERROR IN AGENT LOOP: {e}"
                print(error_msg)
                logger.critical(error_msg, exc_info=True)
                traceback.print_exc()
                with open("agent_crash.log", "w") as f:
                    f.write(f"Error: {e}\n")
                    traceback.print_exc(file=f)
            
        asyncio.run(headless_entry())

    else:
        # GUI Mode - PyWebView + React
        logger.info("Starting GUI mode with PyWebView...")
        
        # Run the GUI with the agent loop
        run_gui_with_agent(client, agent_loop)
