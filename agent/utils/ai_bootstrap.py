
import os
import subprocess
import shutil
import platform
import logging
import asyncio
import httpx

logger = logging.getLogger("AIBootstrap")

class AIBootstrap:
    """
    Handles automatic detection and installation of the Local AI Engine (Ollama).
    """

    OLLAMA_URL_WIN = "https://ollama.com/download/OllamaSetup.exe"
    OLLAMA_URL_MAC = "https://ollama.com/download/Ollama-darwin.zip"
    OLLAMA_URL_LINUX = "https://ollama.com/install.sh"
    
    REQUIRED_MODEL = "qwen2.5:7b"

    def __init__(self, gui=None):
        self.gui = gui
        
    async def is_ollama_running(self) -> bool:
        """Check if Ollama API is accessible."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get("http://localhost:11434/")
                return resp.status_code == 200
        except:
            return False

    async def is_model_installed(self, model_name) -> bool:
        """Check if the required model is available."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get("http://localhost:11434/api/tags")
                if resp.status_code == 200:
                    models = [m['name'] for m in resp.json().get('models', [])]
                    # Check partial match (e.g. llama3:latest matches llama3)
                    return any(model_name in m for m in models)
            return False
        except:
            return False

    async def install_ollama(self):
        """Guide user to install Ollama or attempt automatic install."""
        system = platform.system()
        
        if self.gui:
            await self.gui.add_log(f"AI Engine missing. Installing for {system}...", type="warning")
        else:
            logger.info(f"AI Engine missing. Attempting installation for {system}...")

        if system == "Windows":
            installer_path = "OllamaSetup.exe"
            await self._download_file(self.OLLAMA_URL_WIN, installer_path)
            if self.gui: 
                await self.gui.add_log("Launching AI Installer...", type="info")
            else:
                logger.info("Launching AI Installer. Please complete the setup wizard.")
            os.startfile(installer_path) # Windows only
            
        elif system == "Darwin": # Mac
             import webbrowser
             webbrowser.open("https://ollama.com/download")
             if not self.gui:
                 logger.info("Opening download page. Please install Ollama manually.")
             
        elif system == "Linux":
             install_cmd = "curl -fsSL https://ollama.com/install.sh | sh"
             if self.gui: 
                 await self.gui.add_log(f"Spawning terminal for: {install_cmd}", type="info")
             
             logger.info(f"Attempting to spawn terminal for Ollama installation: {install_cmd}")
             
             # Try to find a terminal emulator to run the command interactively for sudo
             terminals = [
                 ["gnome-terminal", "--", "bash", "-c"],
                 ["konsole", "-e", "bash", "-c"],
                 ["xfce4-terminal", "-e", "bash", "-c"],
                 ["xterm", "-e", "bash", "-c"],
                 ["terminator", "-e", "bash", "-c"]
             ]
             
             spawned = False
             if os.environ.get("DISPLAY"):
                 for term in terminals:
                     if shutil.which(term[0]):
                         try:
                             # Construct the command to keep terminal open after finish or error
                             full_cmd = f"{install_cmd}; echo; echo 'Press Enter to close...'; read"
                             subprocess.Popen(term[:-1] + [term[-1], full_cmd])
                             spawned = True
                             logger.info(f"Spawned {term[0]} for installation.")
                             break
                         except Exception as e:
                             logger.debug(f"Failed to spawn {term[0]}: {e}")
             
             if not spawned:
                 print("\n" + "!"*60)
                 print("ACTION REQUIRED: Ollama (AI Engine) installation needed.")
                 print("Please run this command in a NEW terminal window:")
                 print(f"  {install_cmd}")
                 print("!"*60 + "\n")
                 
                 if self.gui:
                     await self.gui.add_log("Please run the install command in your terminal.", type="error")
                 
                 # Still try a non-interactive background run as last resort (often fails sudo)
                 try:
                    process = await asyncio.create_subprocess_shell(
                        install_cmd,
                        stdout=None,
                        stderr=None
                    )
                    await process.wait()
                 except:
                    pass

    async def pull_model(self, model_name):
        """Pull the required model via API."""
        if self.gui:
             await self.gui.add_log(f"Downloading AI Model ({model_name})... This may take several minutes.", type="info")
        else:
            logger.info(f"Pulling AI Model '{model_name}'... This may take several minutes depending on your connection.")
        
        url = "http://localhost:11434/api/pull"
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("POST", url, json={"name": model_name}) as resp:
                    last_status = ""
                    async for line in resp.aiter_lines():
                        if not line: continue
                        import json
                        try:
                            data = json.loads(line)
                            status = data.get("status", "")
                            if status != last_status:
                                if not self.gui: logger.info(f"Pulling {model_name}: {status}")
                                last_status = status
                            
                            if "completed" in data or "total" in data:
                                # Optional: track progress %
                                pass
                        except:
                            pass
            
            if self.gui: await self.gui.add_log(f"AI Model ({model_name}) ready!", type="success")
            else: logger.info(f"AI Model '{model_name}' is now ready.")
        except Exception as e:
            logger.error(f"Failed to pull model {model_name}: {e}")
            if self.gui: await self.gui.add_log(f"Download failed: {e}", type="error")


    async def _download_file(self, url, dest):
        if self.gui: await self.gui.add_log("Downloading installer...", type="info")
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            with open(dest, 'wb') as f:
                f.write(resp.content)


    async def run_checks(self):
        """Main entry point for checks."""
        if not await self.is_ollama_running():
            await self.install_ollama()
            # Wait loop
            retries = 0
            while not await self.is_ollama_running():
                await asyncio.sleep(2)
                retries += 1
                if retries > 60: # 2 minutes timeout
                    if self.gui: await self.gui.add_log("Timed out waiting for AI to start.", type="error")
                    return False

        if not await self.is_model_installed(self.REQUIRED_MODEL):
            await self.pull_model(self.REQUIRED_MODEL)
            
        return True

ai_bootstrap = AIBootstrap()
