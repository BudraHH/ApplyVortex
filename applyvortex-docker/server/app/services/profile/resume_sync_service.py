
import logging
from uuid import UUID
from datetime import datetime
from typing import Dict, Any, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user.user_repository import UserRepository
from app.repositories.user.profile_repository import ProfileRepository
from app.repositories.user.experience_repository import ExperienceRepository
from app.repositories.user.education_repository import EducationRepository
from app.repositories.user.project_repository import ProjectRepository
from app.repositories.user.certification_repository import CertificationRepository
from app.repositories.user.language_repository import LanguageRepository
from app.repositories.user.accomplishment_repository import AccomplishmentRepository
from app.repositories.user.research_repository import ResearchRepository
from app.repositories.user.notification_repository import NotificationRepository
from app.repositories.skill.skill_repository import SkillRepository
from app.repositories.skill.user_skill_repository import UserSkillRepository

from app.constants.constants import (
    JobType, CompanySize,
    EducationLevel, ProjectType, ProjectStatus, LanguageProficiency, LanguageAbility,
    Availability, WorkMode, NotificationType,
    AccomplishmentCategory, ResearchType
)
from app.services.cache.redis_service import redis_service

logger = logging.getLogger(__name__)

class ResumeSyncService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.skill_repo = SkillRepository(db)
        self.user_skill_repo = UserSkillRepository(db, self.skill_repo)
        
        self.user_repo = UserRepository(db)
        self.profile_repo = ProfileRepository(db)
        self.experience_repo = ExperienceRepository(db, self.skill_repo, self.user_skill_repo)
        self.education_repo = EducationRepository(db)
        self.project_repo = ProjectRepository(db, self.skill_repo, self.user_skill_repo)
        self.cert_repo = CertificationRepository(db)
        self.language_repo = LanguageRepository(db)
        self.accomplishment_repo = AccomplishmentRepository(db)
        self.research_repo = ResearchRepository(db)
        self.notification_repo = NotificationRepository(db)

    async def sync_data(self, user_id: UUID, parsed_data: Dict[str, Any], resume_id: Optional[UUID] = None):
        """
        Sync parsed resume data to user profile tables.
        This is a destructive operation for lists (experiences, etc.) - it adds new records.
        For Profile, it updates existing fields if they vary.
        """
        log_prefix = f"[Resume {resume_id}] " if resume_id else f"[User {user_id}] "
        logger.info(f"{log_prefix}Starting resume data sync.")
        
        counts = {
            "experiences": 0,
            "educations": 0,
            "projects": 0,
            "certifications": 0,
            "languages": 0,
            "accomplishments": 0,
            "research": 0,
            "skills": 0
        }
        
        try:
            # 1. Sync Personal Details (Profile)
            if 'personal_details' in parsed_data:
                await self._sync_profile(user_id, parsed_data['personal_details'], log_prefix)
            
            # 2. Sync Experiences
            if 'experiences' in parsed_data and parsed_data['experiences']:
                count = len(parsed_data['experiences'])
                logger.info(f"{log_prefix}Found {count} experiences to sync.")
                await self._sync_experiences(user_id, parsed_data['experiences'], log_prefix)
                counts["experiences"] = count
                
            # 3. Sync Education
            if 'educations' in parsed_data and parsed_data['educations']:
                count = len(parsed_data['educations'])
                logger.info(f"{log_prefix}Found {count} education entries to sync.")
                await self._sync_educations(user_id, parsed_data['educations'], log_prefix)
                counts["educations"] = count
                
            # 4. Sync Projects
            if 'projects' in parsed_data and parsed_data['projects']:
                count = len(parsed_data['projects'])
                logger.info(f"{log_prefix}Found {count} projects to sync.")
                await self._sync_projects(user_id, parsed_data['projects'], log_prefix)
                counts["projects"] = count
                
            # 5. Sync Certifications
            if 'certifications' in parsed_data and parsed_data['certifications']:
                count = len(parsed_data['certifications'])
                logger.info(f"{log_prefix}Found {count} certifications to sync.")
                await self._sync_certifications(user_id, parsed_data['certifications'], log_prefix)
                counts["certifications"] = count
                
            # 6. Sync Languages
            if 'languages' in parsed_data and parsed_data['languages']:
                count = len(parsed_data['languages'])
                logger.info(f"{log_prefix}Found {count} languages to sync.")
                await self._sync_languages(user_id, parsed_data['languages'], log_prefix)
                counts["languages"] = count
            
            # 7. Sync Accomplishments
            if 'accomplishments' in parsed_data and parsed_data['accomplishments']:
                count = len(parsed_data['accomplishments'])
                logger.info(f"{log_prefix}Found {count} accomplishments to sync.")
                await self._sync_accomplishments(user_id, parsed_data['accomplishments'], log_prefix)
                counts["accomplishments"] = count
            
            # 8. Sync Research
            if 'research' in parsed_data and parsed_data['research']:
                count = len(parsed_data['research'])
                logger.info(f"{log_prefix}Found {count} research entries to sync.")
                await self._sync_research(user_id, parsed_data['research'], log_prefix)
                counts["research"] = count
                
            # 9. Sync Skills
            if 'technical_skills' in parsed_data and parsed_data['technical_skills']:
                count = len(parsed_data['technical_skills'])
                logger.info(f"{log_prefix}Found {count} technical skills to sync.")
                await self._sync_skills(user_id, parsed_data['technical_skills'], log_prefix)
                counts["skills"] = count
            
            # Send SUMMARY Notification
            summary_msg = (
                f"Resume Processed: Successfully updated profile with "
                f"experiences ({counts['experiences']}), "
                f"education ({counts['educations']}), "
                f"projects ({counts['projects']}), "
                f"certifications ({counts['certifications']}), "
                f"skills ({counts['skills']})."
            )
            
            await self.notification_repo.create_notification(
                user_id=user_id,
                type=NotificationType.SYSTEM.value,
                title="Resume Parsing Complete",
                message=summary_msg,
                action_url="/profile-setup",
                metadata={"source": "resume_parser", "counts": counts}
            )
                
            # Final Commit for everything!
            await self.db.commit()
            logger.info(f"{log_prefix}Resume sync completed and committed successfully.")
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"{log_prefix}CRITICAL ERROR syncing resume data (rolled back): {traceback.format_exc() if 'traceback' in globals() else e}")
            raise e

    def _parse_date_string(self, date_str: Optional[str]) -> tuple[Optional[int], Optional[int]]:
        """Parse YYYY-MM-DD, YYYY-MM, or YYYY string into (month, year)."""
        if not date_str or not isinstance(date_str, str):
            return None, None
            
        parts = date_str.split('-')
        try:
            year = int(parts[0])
            month = int(parts[1]) if len(parts) > 1 else 1
            return month, year
        except (ValueError, IndexError):
            return None, None

    async def _sync_profile(self, user_id: UUID, data: Dict[str, Any], log_prefix: str = ""):
        logger.debug(f"{log_prefix}Updating profile personal details...")
        profile = await self.profile_repo.get_by_user_id(user_id)
        
        # Helper to safely get value from nested dict or flat
        def get_val(key, default=None):
            return data.get(key) if data.get(key) is not None else default
            
        update_data = {}

        # Name fields
        if get_val('first_name'): update_data['first_name'] = get_val('first_name')
        if get_val('middle_name'): update_data['middle_name'] = get_val('middle_name')
        if get_val('last_name'): update_data['last_name'] = get_val('last_name')
        
        # Phone normalization
        raw_phone = get_val('phone_number') or get_val('phone')
        raw_code = get_val('phone_country_code')
        norm_phone, norm_code = self._normalize_phone(raw_phone, raw_code)
        
        if norm_phone: update_data['phone_number'] = norm_phone
        if norm_code: update_data['phone_country_code'] = norm_code
        elif norm_phone: update_data['phone_country_code'] = "+91" # Default for synced numbers
        
        # Alternate Phone
        raw_alt_phone = get_val('alternate_phone')
        raw_alt_code = get_val('alternate_phone_country_code')
        norm_alt_phone, norm_alt_code = self._normalize_phone(raw_alt_phone, raw_alt_code)
        
        if norm_alt_phone: update_data['alternate_phone'] = norm_alt_phone
        if norm_alt_code: update_data['alternate_phone_country_code'] = norm_alt_code
        
        if get_val('headline'): update_data['headline'] = get_val('headline')
        if get_val('professional_summary'): update_data['professional_summary'] = get_val('professional_summary')
        if get_val('current_role'): update_data['current_role'] = get_val('current_role')
        if get_val('current_company'): update_data['current_company'] = get_val('current_company')
        if get_val('years_of_experience'): update_data['years_of_experience'] = get_val('years_of_experience')
        if get_val('willing_to_relocate') is not None: update_data['willing_to_relocate'] = get_val('willing_to_relocate')
        
        # New Enums
        if get_val('preferred_work_mode'): 
            try:
                val = get_val('preferred_work_mode').lower()
                update_data['preferred_work_mode'] = WorkMode(val)
            except ValueError: pass
        
        if get_val('job_search_status'): update_data['job_search_status'] = get_val('job_search_status')
        if get_val('notice_period_days') is not None: update_data['notice_period_days'] = get_val('notice_period_days')
        if get_val('expected_salary_min') is not None: update_data['expected_salary_min'] = get_val('expected_salary_min')
        if get_val('expected_salary_max') is not None: update_data['expected_salary_max'] = get_val('expected_salary_max')
        if get_val('salary_currency'): update_data['salary_currency'] = get_val('salary_currency')

        # Nested Location
        loc = data.get('location', {})
        if loc:
            if loc.get('city'): update_data['current_city'] = loc.get('city')
            if loc.get('state'): update_data['current_state'] = loc.get('state')
            if loc.get('country'): update_data['current_country'] = loc.get('country')
            if loc.get('postal_code'): update_data['current_postal_code'] = loc.get('postal_code')
            if loc.get('address'): update_data['current_address'] = loc.get('address')

        # URLs
        urls = data.get('urls', {})
        if urls:
            for k, v in urls.items():
                if v: update_data[k] = v

        if update_data:
            from app.constants.constants import Gender
            if not profile:
                if 'current_city' not in update_data:
                    update_data['current_city'] = 'Remote' # fallback
                if 'gender' not in update_data:
                    update_data['gender'] = Gender.PREFER_NOT_TO_SAY.value
            
            await self.profile_repo.create_or_update_profile(user_id, update_data)
            logger.info(f"{log_prefix}Profile personal details updated.")

    async def _sync_experiences(self, user_id: UUID, experiences: List[Dict[str, Any]], log_prefix: str = ""):
        # Prepare experience data for replace_all
        experience_data = []
        for i, exp in enumerate(experiences):
            title = exp.get('job_title')
            company = exp.get('company_name')
            logger.debug(f"{log_prefix}Processing Experience {i+1}: {title} at {company}")
            
            # Required fields validation
            if not title or not company:
                logger.warning(f"{log_prefix}Skipping experience {i+1} due to missing title or company")
                continue
                
            # Enum conversions
            emp_type = JobType.FULL_TIME
            if exp.get('employment_type'):
                try: emp_type = JobType(exp.get('employment_type'))
                except: pass
                
            loc_type = WorkMode.ONSITE
            # Map work_mode from parser to location_type in DB
            if exp.get('work_mode'):
                try: loc_type = WorkMode(exp.get('work_mode').lower())
                except: pass
                
            comp_size = None
            if exp.get('company_size'):
                try: comp_size = CompanySize(exp.get('company_size'))
                except: pass

            # Date parsing
            start_month, start_year = self._parse_date_string(exp.get('start_date'))
            end_month, end_year = self._parse_date_string(exp.get('end_date'))

            # Extract skills for this experience
            skills_list = exp.get('skills_used', []) or exp.get('skills', []) or exp.get('technologies', [])
            
            exp_data = {
                'job_title': exp['job_title'],
                'company_name': exp['company_name'],
                # 'company_website': exp.get('company_website'),  # Invalid field
                # 'company_industry': exp.get('company_industry'), # Invalid field
                # 'company_size': comp_size, # Invalid field
                'work_mode': loc_type,
                'city': exp.get('city'),
                'state': exp.get('state'),
                'country': exp.get('country') or 'India',
                'start_month': start_month or 1,
                'start_year': start_year or datetime.now().year,
                'end_month': end_month,
                'end_year': end_year,
                'is_current': exp.get('is_current', False),
                'employment_type': emp_type,
                'job_summary': self._validate_job_summary(exp.get('job_summary')),
                'key_responsibilities': exp.get('key_responsibilities'),
                'achievements': exp.get('achievements'),
                # 'team_size': exp.get('team_size'), # Invalid field
                # 'reporting_to': exp.get('reporting_to'), # Invalid field
                'skills': skills_list  # Pass skills for mapping
            }
            experience_data.append(exp_data)
        
        # Use replace_all to prevent duplicates
        if experience_data:
            await self.experience_repo.replace_all(user_id, experience_data)
            logger.info(f"{log_prefix}Successfully replaced all experiences with {len(experience_data)} new records.")

    async def _sync_educations(self, user_id: UUID, educations: List[Dict[str, Any]], log_prefix: str = ""):
        # Prepare education data for replace_all
        education_data = []
        for i, edu in enumerate(educations):
            inst = edu.get('institution_name')
            deg = edu.get('degree_name')
            logger.debug(f"{log_prefix}Processing Education {i+1}: {deg} at {inst}")
            
            if not inst or not deg:
                logger.warning(f"{log_prefix}Skipping education {i+1} due to missing institution or degree")
                continue
                
            deg_type = EducationLevel.UNDERGRADUATE
            if edu.get('degree_type'):
                try: deg_type = EducationLevel(edu.get('degree_type'))
                except: pass
            
            # Date parsing
            start_month, start_year = self._parse_date_string(edu.get('start_date'))
            end_month, end_year = self._parse_date_string(edu.get('end_date'))

            edu_data = {
                'institution_name': edu.get('institution_name'),
                'degree_name': edu.get('degree_name'),
                'field_of_study': edu.get('field_of_study') or 'General',
                'degree_type': deg_type,
                # 'major': edu.get('major'), # Invalid field
                # 'minor': edu.get('minor'), # Invalid field
                'university_name': edu.get('university_name'),
                'city': edu.get('city'),
                'state': edu.get('state'),
                'country': edu.get('country') or 'India',
                'start_month': start_month or 1,
                'start_year': start_year or datetime.now().year,
                'end_month': end_month,
                'end_year': end_year,
                'status': EducationStatus.IN_PROGRESS.value if edu.get('is_current', False) else EducationStatus.COMPLETED.value,
                'grade_value': edu.get('grade_value'),
                'relevant_coursework': edu.get('relevant_coursework'),
                'activities': edu.get('activities'),
                'thesis_title': edu.get('thesis_title'),
                'thesis_description': edu.get('thesis_description')
            }
            education_data.append(edu_data)
        
        # Use replace_all to prevent duplicates
        if education_data:
            await self.education_repo.replace_all(user_id, education_data)
            logger.info(f"{log_prefix}Successfully replaced all education with {len(education_data)} new records.")

    async def _sync_projects(self, user_id: UUID, projects: List[Dict[str, Any]], log_prefix: str = ""):
        # Prepare project data for replace_all
        project_data = []
        for i, proj in enumerate(projects):
            name = proj.get('project_name')
            logger.debug(f"{log_prefix}Processing Project {i+1}: {name}")
            
            if not name:
                continue
                
            proj_type = ProjectType.PERSONAL
            if proj.get('project_type'):
                try: proj_type = ProjectType(proj.get('project_type'))
                except: pass
            
            # Extract skills for this project
            tech_stack = proj.get('technologies_used', []) or proj.get('technologies', []) or proj.get('skills', [])
                
            # Date parsing
            start_month, start_year = self._parse_date_string(proj.get('start_date'))
            end_month, end_year = self._parse_date_string(proj.get('end_date'))

            # Extract skills for this project
            tech_stack = proj.get('technologies_used', []) or proj.get('technologies', []) or proj.get('skills', [])
                
            proj_data = {
                'project_name': proj['project_name'],
                'project_type': proj_type,
                'short_description': proj.get('short_description'),
                'detailed_description': proj.get('detailed_description'),
                'start_month': start_month,
                'start_year': start_year,
                'end_month': end_month,
                'end_year': end_year,
                'status': ProjectStatus.IN_PROGRESS.value if proj.get('is_ongoing', False) else ProjectStatus.COMPLETED.value, # Status logic based on parser
                'github_url': proj.get('github_url'),
                'live_url': proj.get('live_url'),
                # 'documentation_url': proj.get('documentation_url'), # Invalid field
                'key_features': proj.get('key_features'),
                # 'challenges_faced': proj.get('challenges_faced'), # Invalid field
                'skills': tech_stack  # Pass skills for mapping
            }
            project_data.append(proj_data)
        
        # Use replace_all to prevent duplicates
        if project_data:
            await self.project_repo.replace_all(user_id, project_data)
            logger.info(f"{log_prefix}Successfully replaced all projects with {len(project_data)} new records.")

    async def _sync_certifications(self, user_id: UUID, certs: List[Dict[str, Any]], log_prefix: str = ""):
        # Prepare certification data for replace_all
        cert_data = []
        for i, cert in enumerate(certs):
            name = cert.get('name')
            logger.debug(f"{log_prefix}Processing Certification {i+1}: {name}")
            
            if not name or not cert.get('issuing_organization'):
                continue
                
            # Date parsing
            issue_date = None
            if cert.get('issue_date'):
               try: issue_date = datetime.strptime(cert['issue_date'], '%Y-%m-%d').date()
               except: pass

            expiry_date = None
            if cert.get('expiry_date'):
               try: expiry_date = datetime.strptime(cert['expiry_date'], '%Y-%m-%d').date()
               except: pass
                
            cert_dict = {
                'name': cert['name'],
                'issuing_organization': cert['issuing_organization'],
                'credential_id': cert.get('credential_id'),
                'credential_url': cert.get('credential_url'),
                'issue_date': issue_date,
                'expiry_date': expiry_date,
                'does_not_expire': cert.get('does_not_expire', False)
            }
            cert_data.append(cert_dict)
        
        # Use replace_all to prevent duplicates
        if cert_data:
            await self.cert_repo.replace_all(user_id, cert_data)
            logger.info(f"{log_prefix}Successfully replaced all certifications with {len(cert_data)} new records.")

    async def _sync_languages(self, user_id: UUID, languages: List[Dict[str, Any]], log_prefix: str = ""):
        # Prepare language data for replace_all
        language_data = []
        for i, lang in enumerate(languages):
            name = lang.get('language')
            logger.debug(f"{log_prefix}Processing Language {i+1}: {name}")
            if not name:
                continue
            
            prof = LanguageProficiency.PROFESSIONAL
            if lang.get('proficiency'):
                try: prof = LanguageProficiency(lang.get('proficiency'))
                except: pass
                
            abil = LanguageAbility.BOTH
            if lang.get('ability'):
                try: abil = LanguageAbility(lang.get('ability'))
                except: pass

            lang_data = {
                'language': lang['language'],
                'proficiency': prof,
                'ability': abil
            }
            language_data.append(lang_data)
        
        # Use replace_all to prevent duplicates
        if language_data:
            await self.language_repo.replace_all(user_id, language_data)
            logger.info(f"{log_prefix}Successfully replaced all languages with {len(language_data)} new records.")

    async def _sync_accomplishments(self, user_id: UUID, accomplishments: List[Dict[str, Any]], log_prefix: str = ""):
        acc_data = []
        for i, acc in enumerate(accomplishments):
            title = acc.get('title')
            logger.debug(f"{log_prefix}Processing Accomplishment {i+1}: {title}")
            if not title:
                continue
                
            cat = AccomplishmentCategory.OTHER
            if acc.get('category'):
                try:
                    # Try to match string to enum name
                    cat_name = acc['category'].upper().replace(" ", "_")
                    cat = AccomplishmentCategory[cat_name]
                except: pass
                
            acc_data.append({
                'title': acc['title'],
                'category': cat.value if hasattr(cat, 'value') else cat,
                'description': acc.get('description')
            })
            
        if acc_data:
            await self.accomplishment_repo.replace_all(user_id, acc_data)
            logger.info(f"{log_prefix}Successfully replaced all accomplishments with {len(acc_data)} new records.")

    async def _sync_research(self, user_id: UUID, research_list: List[Dict[str, Any]], log_prefix: str = ""):
        res_data = []
        for i, res in enumerate(research_list):
            title = res.get('title')
            logger.debug(f"{log_prefix}Processing Research {i+1}: {title}")
            if not title or not res.get('authors'):
                continue
                
            r_type = ResearchType.JOURNAL
            if res.get('research_type'):
                try:
                    type_name = res['research_type'].upper().replace(" ", "_")
                    r_type = ResearchType[type_name]
                except: pass

            # Date parsing for publication
            pub_month = 1
            pub_year = datetime.now().year
            
            pub_date_str = res.get('publication_date')
            if pub_date_str:
                try:
                    # Expecting YYYY-MM or YYYY
                    parts = pub_date_str.split('-')
                    if len(parts) >= 1:
                        pub_year = int(parts[0])
                    if len(parts) >= 2:
                        pub_month = int(parts[1])
                except: pass
            
            # Validation for abstract (min_length=20)
            abstract = res.get('abstract') or "No abstract provided in resume."
            if len(abstract) < 20:
                abstract = abstract.ljust(20, '.')

            res_data.append({
                'title': res['title'],
                'research_type': r_type.value if hasattr(r_type, 'value') else r_type,
                'authors': res['authors'],
                'publisher': res.get('publisher') or 'Unknown',
                'publication_month': pub_month,
                'publication_year': pub_year,
                'url': res.get('url'),
                'abstract': abstract
            })
            
        if res_data:
            await self.research_repo.replace_all(user_id, res_data)
            logger.info(f"{log_prefix}Successfully replaced all research with {len(res_data)} new records.")
            
    async def _sync_skills(self, user_id: UUID, skills_list: List[str], log_prefix: str = ""):
        if not skills_list:
            return
        
        logger.debug(f"{log_prefix}Aggregation skills to sync: {len(skills_list)} raw skills found")

        # 1. Get or Create Skills in master table (bulk)
        skills_dict = await self.skill_repo.bulk_get_or_create_skills(skills_list)
        skill_ids = [s.id for s in skills_dict.values()]
        
        # 2. Add to user's skill map if not exists (bulk with conflict handling)
        if skill_ids:
            logger.info(f"{log_prefix}Resolved {len(skill_ids)} unique skill IDs from resume.")
            await self.user_skill_repo.add_skills_if_not_exists(user_id, skill_ids)
            logger.info(f"{log_prefix}Successfully synced user skill map.")

    def _validate_job_summary(self, summary: Optional[str]) -> Optional[str]:
        """Validate job summary against DB constraint (length 20-2000)."""
        if not summary:
            return None
        
        summary = summary.strip()
        if not summary:
            return None # Empty string becomes NULL
            
        if len(summary) < 20:
            # If too short, append generic text or nullify. 
            # Nullifying is safer than fake data, but losing data is bad.
            # Appending context might make it valid.
            # "Role: Developer" -> "Role: Developer (Job summary extracted from resume)"
            return summary + " (Details available in original resume)"
            
        if len(summary) > 2000:
            return summary[:1997] + "..."
            
        return summary


    def _normalize_phone(self, phone: Any, country_code: Any) -> tuple[Optional[str], Optional[str]]:
        """Normalize phone number and country code, specifically handling Indian numbers."""
        if not phone:
            return None, (country_code if country_code else None)
            
        # Convert to string and remove non-digits
        phone_str = str(phone)
        country_code_str = str(country_code) if country_code else ""
        
        digits = "".join(filter(str.isdigit, phone_str))
        
        # If the digits already contain the country code at the start (e.g. 917397...), strip it if country_code is +91
        if digits.startswith("91") and len(digits) == 12:
            digits = digits[2:]
            country_code_str = "+91"
        
        # If it's 10 digits and starts with 7, 8, or 9, it's likely an Indian mobile
        if len(digits) == 10 and digits[0] in '789':
            # Force +91 if it's currently something else that might be a misinterpretation
            # like +7 (Russia) if the AI saw "7397..."
            if country_code_str == "+7" or country_code_str == "7" or not country_code_str:
                country_code_str = "+91"
        
        # Ensure country code has +
        if country_code_str and not country_code_str.startswith("+"):
            country_code_str = "+" + country_code_str
                
        return digits, (country_code_str if country_code_str else None)