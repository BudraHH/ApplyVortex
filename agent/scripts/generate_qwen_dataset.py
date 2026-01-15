import json
import random
import logging
import os
from typing import List, Dict, Any

# Configure Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Try importing Faker, else use fallback
try:
    from faker import Faker
    fake = Faker()
    HAS_FAKER = True
except ImportError:
    HAS_FAKER = False
    logger.warning("Faker library not found. Using internal fallback data.")

class DatasetGenerator:
    """
    Generates synthetic training data for fine-tuning Qwen 2.5-7B-Instruct.
    Includes FULL Schema generation and Advanced Scoring Logic.
    """

    OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "applyvortex_qwen_train.jsonl")
    NUM_SAMPLES = 5000  # Colab Scale: High quality fine-tuning dataset

    # Strict Qwen 2.5 / ChatML Roles
    ROLE_SYSTEM = "system"
    ROLE_USER = "user"
    ROLE_ASSISTANT = "assistant"

    # --- Internal Data Pools ---
    SKILLS = [
        "Python", "React", "AWS", "Docker", "Kubernetes", "FastAPI", 
        "PostgreSQL", "Terraform", "TypeScript", "Go", "Java", "C++", 
        "Machine Learning", "NLP", "Git", "CI/CD", "Linux", "Azure",
        "Redis", "GraphQL", "MongoDB", "Selenium", "Playwright"
    ]
    COMPANIES = ["TechCorp", "DataSystems", "InnovateX", "CloudScale", "SoftSolutions", "AlphaDynamics", "GlobalTech"]
    ROLES = ["Software Engineer", "DevOps Engineer", "Data Scientist", "Frontend Developer", "Backend Architect", "Full Stack Developer"]
    UNIVERSITIES = ["MIT", "Stanford University", "IIT Bombay", "University of Texas at Dallas", "Georgia Tech", "University of Toronto"]
    DEGREES = ["Bachelor of Science", "Master of Science", "PhD"]
    MAJORS = ["Computer Science", "Electrical Engineering", "Information Technology", "Data Science"]
    CERT_NAMES = ["AWS Certified Solutions Architect", "CKA: Certified Kubernetes Administrator", "Google Cloud Professional"]
    ISSUERS = ["Amazon Web Services", "CNCF", "Google", "PMI", "HashiCorp"]
    PROJECT_TITLES = ["E-commerce Microservices", "AI Chatbot", "Smart Traffic System", "DeFi Wallet", "Health Monitoring App"]

    # --- 5 Distinct Job Description Templates ---
    JD_TEMPLATES = [
        # 1. The Standard Enterprise JD
        """**Job Title:** {role}
**Company:** {company}
**Location:** Remote / Hybrid

**About Us:**
{company} is a global leader in technology solutions. We are looking for a skilled {role} to join our core infrastructure team.

**Responsibilities:**
* Design and implement scalable solutions using {skill_1}.
* Maintain and upgrade existing systems built on {skill_2}.
* Collaborate with cross-functional teams to define requirements.

**Requirements:**
* Bachelor's degree in Computer Science or related field.
* 3+ years of professional experience with {skill_1}.
* Strong proficiency in {skill_2} and {skill_3}.
* Experience with Agile methodologies.""",

        # 2. The Fast-Paced Startup JD
        """**We are hiring a {role}!**
Join {company}, the fastest-growing startup in the valley. We break things fast and fix them faster.

**What you'll do:**
* Own the entire stack from database to UI.
* Deploy code daily using {skill_1} and {skill_3}.
* Optimize performance for high-traffic endpoints.

**Who you are:**
* A hacker at heart.
* Expert in {skill_1}.
* You dream in {skill_2}.
* No degree required, just show us your GitHub.""",

        # 3. The Brief Contract / Freelance JD
        """**Urgent Requirement: {role}**
Client: {company}
Duration: 6 Months
Rate: Competitive

We need a contractor to help migrate our legacy backend to {skill_1}.
Must have strong hands-on experience with {skill_2} and {skill_3}.
Immediate start required. Remote work is okay.""",

        # 4. The "Tech Giant" / Academic JD
        """**Role:** {role} - R&D Division
**Organization:** {company} Research

**Summary:**
The Research & Development team at {company} is seeking a {role} to work on next-generation distributed systems. The ideal candidate has a strong theoretical background and practical experience with {skill_1}.

**Qualifications:**
* MS or PhD in Computer Science preferred.
* Deep understanding of {skill_2} architecture.
* 5+ years experience with {skill_1}.
* Publications in relevant journals are a plus.
* Proficiency in {skill_3} containerization.""",

        # 5. The "Jack of All Trades" / Agency JD
        """**Looking for a Rockstar {role}**
At {company} Digital Agency, we build award-winning experiences for top brands.

**The Gig:**
You will juggle multiple client projects, primarily using {skill_1} for backend and {skill_2} for integrations.

**Must Haves:**
* {skill_1} wizardry.
* Solid grasp of {skill_2}.
* Familiarity with {skill_3}.
* Ability to hit tight deadlines.
* Great communication skills."""
    ]

    # --- System Prompts ---
    SYSTEM_PROMPT_PARSING = (
        "You are a specialized Resume Parsing Engine. Extract the following candidate data "
        "into the strict ApplyVortex JSON schema. Return ONLY valid JSON."
    )
    SYSTEM_PROMPT_SCORING = (
        "You are a Talent Intelligence AI. Analyze the candidate profile against the Job Description. "
        "Provide a match score (0-100) and specific gap analysis in strict JSON."
    )
    SYSTEM_PROMPT_TAILORING = (
        "You are an Expert Resume Architect. Generate a fully tailored resume based on the provided Profile JSON and Job Description. "
        "Strictly follow formatting rules: If the candidate has Experience, place Education at the bottom. "
        "If the candidate has NO Experience (Fresher), place Education immediately after the Summary. "
        "Output the resume in clean, professional plain text format."
    )

    def __init__(self):
        self.samples = []

    # --- Helpers ---
    def _get_random_name(self):
        if HAS_FAKER: return fake.name()
        return f"{random.choice(['John', 'Jane', 'Alice', 'Bob'])} {random.choice(['Doe', 'Smith', 'Johnson', 'Brown'])}"

    def _get_random_date(self, start=2015, end=2024):
        year = random.randint(start, end)
        month = random.randint(1, 12)
        return f"{year}-{month:02d}"

    def _get_random_city(self):
        if HAS_FAKER: return fake.city()
        return random.choice(["San Francisco", "New York", "London", "Berlin", "Bangalore"])

    def _get_random_email(self, name_slug):
        if HAS_FAKER: return fake.email()
        clean_slug = "".join(c for c in name_slug if c.isalnum())
        domain = random.choice(["gmail.com", "yahoo.com", "outlook.com", "tech.io"])
        return f"{clean_slug.lower()}{random.randint(10,99)}@{domain}"

    def validate_json(self, json_str: str) -> bool:
        try:
            json.loads(json_str)
            return True
        except json.JSONDecodeError:
            return False

    # --- Shared Data Generator (Create a Profile Object) ---
    def _generate_clean_profile_data(self, override_skills=None, override_role=None) -> Dict:
        """
        Generates a Python dictionary matching the full ApplyVortex Schema.
        Allows overriding skills/role to force specific matches/mismatches.
        """
        name_parts = self._get_random_name().split()
        first_name = name_parts[0]
        last_name = name_parts[-1]
        
        # Determine Skills and Role
        if override_skills:
            skills = override_skills
            # Add some noise skills
            skills.extend(random.sample([s for s in self.SKILLS if s not in skills], k=2))
        else:
            skills = random.sample(self.SKILLS, k=random.randint(5, 10))
            
        role = override_role if override_role else random.choice(self.ROLES)
        city = self._get_random_city()

        return {
            "personal_details": {
                "first_name": first_name,
                "middle_name": None,
                "last_name": last_name,
                "email": self._get_random_email(f"{first_name}{last_name}"),
                "phone": "+1-555-0199",
                "linkedin_url": f"linkedin.com/in/{first_name.lower()}{last_name.lower()}",
                "github_url": f"github.com/{first_name.lower()}",
                "portfolio_url": None,
                "professional_summary": f"Experienced {role} with expertise in {skills[0]} and {skills[1]}.",
                "job_title": role,
                "location": {"city": city, "state": "State", "country": "USA"}
            },
            "education": [
                {
                    "institution": random.choice(self.UNIVERSITIES),
                    "university": random.choice(self.UNIVERSITIES), # Intentionally redundant as per schema
                    "degree": random.choice(self.DEGREES),
                    "field_of_study": random.choice(self.MAJORS),
                    "start_date": self._get_random_date(2015, 2016),
                    "end_date": self._get_random_date(2019, 2020),
                    "current": False,
                    "location": {"city": city, "state": "State", "country": "USA"},
                    "gpa": "3.8",
                    "grade_type": "GPA",
                    "description": "Focus on Distributed Systems.",
                    "relevant_coursework": ["Algorithms", "DB Systems"],
                    "honors_awards": [],
                    "thesis_title": None,
                    "thesis_description": None,
                    "research_areas": [],
                    "publications": []
                }
            ],
            "experience": [
                {
                    "company": random.choice(self.COMPANIES),
                    "title": role,
                    "start_date": self._get_random_date(2021, 2022),
                    "end_date": None,
                    "current": True,
                    "location": {"city": city, "state": "State", "country": "USA"},
                    "description": [
                        f"Implemented {skills[0]} based microservices.",
                        f"Optimized database performance using {skills[1] if len(skills)>1 else 'SQL'}."
                    ],
                    "achievements": ["Reduced load times by 30%"],
                    "skills_used": skills[:3],
                    "employment_type": "Full-time"
                }
            ],
            "projects": [
                {
                    "name": random.choice(self.PROJECT_TITLES),
                    "short_description": "Internal tool automation.",
                    "description": f"Automated workflows using {skills[0]}.",
                    "url": None,
                    "github_url": None,
                    "start_date": "2023-01",
                    "end_date": "2023-06",
                    "is_ongoing": False,
                    "skills_used": skills[:2]
                }
            ],
            "skills": skills,
            "certifications": [
                {
                    "name": random.choice(self.CERT_NAMES),
                    "issuer": random.choice(self.ISSUERS),
                    "date": self._get_random_date(2021, 2023),
                    "url": None
                }
            ],
            "languages": [
                {"language": lang, "proficiency": random.choice(["Native", "Fluent", "Intermediate"])}
                for lang in ["English", "Spanish", "German"][:random.randint(1,2)]
            ],
            "research": [
                {
                    "title": "Optimizing Distributed Systems",
                    "publisher": "IEEE Access",
                    "date": "2023-05",
                    "url": "https://doi.org/..."
                }
            ] if random.random() < 0.2 else [], # 20% chance of research
            "accomplishments": [
                {   
                    "title": "Hackathon Winner",
                    "description": "First place in internal hackathon.",
                    "category": "Awards"
                }
            ]
        }

    def _generate_messy_resume_text(self, data: Dict) -> str:
        """Converts clean JSON data to messy text (Simulating PDF extraction)"""
        lines = []
        p = data['personal_details']
        lines.append(f"{p['first_name']} {p['last_name']}")
        lines.append(f"{p['email']} | {p['phone']}")
        lines.append(f"Location: {p['location']['city']}")
        lines.append(f"\n{p['professional_summary']}")
        
        lines.append("\nEXPERIENCE")
        for exp in data['experience']:
            lines.append(f"{exp['title']} at {exp['company']}")
            lines.append(f"{exp['start_date']} - Present")
            for bullet in exp['description']:
                lines.append(f"- {bullet}")
        
        lines.append("\nEDUCATION")
        for edu in data['education']:
            lines.append(f"{edu['university']} - {edu['degree']}")
        
        lines.append("\nSKILLS")
        lines.append(", ".join(data['skills']))
        
        if data['certifications']:
            lines.append("\nCERTIFICATIONS")
            for cert in data['certifications']:
                lines.append(f"{cert['name']} - {cert['issuer']}")
        
        if data['languages']:
            lines.append("\nLANGUAGES")
            langs = [l['language'] for l in data['languages']]
            lines.append(", ".join(langs))
            
        if data['research']:
            lines.append("\nPUBLICATIONS")
            for res in data['research']:
                lines.append(f"{res['title']} - {res['publisher']} ({res['date']})")
            
        if data['accomplishments']:
             lines.append("\nAWARDS")
             for acc in data['accomplishments']:
                 lines.append(f"{acc['title']}: {acc['description']}")
        
        # Add Noise
        raw = "\n".join(lines)
        if random.random() < 0.3: raw += "\n\nPage 1 of 1"
        return raw

    # --- THE FORMATTER (Ground Truth Generator) ---
    def _generate_tailored_resume_text(self, data: Dict) -> str:
        """
        Constructs the resume string adhering to the strict format rules:
        - Exp Exists: Summary -> Skills -> Exp -> Proj -> Edu
        - No Exp: Summary -> Edu -> Skills -> Proj
        """
        p = data['personal_details']
        has_exp = len(data['experience']) > 0

        # 1. Header (Centered logic simulated with text)
        lines = []
        lines.append(f"\t{p['first_name']} {p.get('middle_name', '')} {p['last_name']}")
        lines.append(f"{p['location']['city']}, {p['location']['state']}")
        lines.append(f"{p['phone']} | {p['email']} | {p['linkedin_url']} | {p['github_url']}")
        lines.append("")

        # 2. Professional Summary
        lines.append("Professional Summary")
        lines.append(p['professional_summary'])
        lines.append("")

        # 3. Helper for Sections
        def add_education():
            lines.append("Education")
            for edu in data['education']:
                lines.append(f"{edu['institution']}")
                lines.append(f"{edu['degree']}")
                lines.append(f"{edu['start_date']} – {edu['end_date']}")
                lines.append(f"{edu['location']['city']}, {edu['location']['state']}")
            lines.append("")

        def add_skills():
            lines.append("Technical Skills")
            # Simulate categorization based on the flat list
            skills = data['skills']
            lines.append(f"Front-End Development: {', '.join(skills[:2])}")
            lines.append(f"Back-End Development: {', '.join(skills[2:4])}")
            lines.append(f"Databases & Cloud: {', '.join(skills[4:6])}")
            lines.append(f"Core Concepts: Data Structures, OOP, Agile")
            lines.append("")

        def add_experience():
            if not data['experience']: return
            lines.append("Professional Experience")
            for exp in data['experience']:
                lines.append(f"{exp['company']}")
                lines.append(f"{exp['start_date']} – {exp.get('end_date', 'Present')}")
                lines.append(f"{exp['title']}")
                lines.append(f"{exp['location']['city']}")
                for bullet in exp['description']:
                    lines.append(f"– {bullet}")
            lines.append("")

        def add_projects():
            lines.append("Projects")
            for proj in data['projects']:
                tech_stack = ", ".join(proj['skills_used'])
                lines.append(f"{proj['name']} | {tech_stack}")
                lines.append(f"{proj['start_date']}")
                lines.append(f"– {proj['description']}")
                lines.append("– Designed secure authentication and enforced validation.")
            lines.append("")

        # 4. Conditional Layout Logic
        if has_exp:
            # Format: Summary -> Skills -> Experience -> Projects -> Education
            add_skills()
            add_experience()
            add_projects()
            add_education()
        else:
            # Format: Summary -> Education -> Skills -> Projects
            add_education()
            add_skills()
            add_projects()

        return "\n".join(lines)

    # --- Task A: Parsing ---
    def _create_parsing_example(self) -> Dict:
        clean_data = self._generate_clean_profile_data()
        messy_input = self._generate_messy_resume_text(clean_data)
        return {
            "messages": [
                {"role": self.ROLE_SYSTEM, "content": self.SYSTEM_PROMPT_PARSING},
                {"role": self.ROLE_USER, "content": messy_input},
                {"role": self.ROLE_ASSISTANT, "content": json.dumps(clean_data)}
            ]
        }

    # --- Task B: Scoring (High Fidelity) ---
    def _create_scoring_example(self) -> Dict:
        """
        Generates a Scoring example using FULL PROFILE DATA and REALISTIC JDs.
        Simulates High, Medium, and Low matches.
        """
        
        # 1. Select Target Job Criteria
        jd_role = random.choice(self.ROLES)
        jd_company = random.choice(self.COMPANIES)
        primary_skill = random.choice(self.SKILLS)
        secondary_skill = random.choice([s for s in self.SKILLS if s != primary_skill])
        tertiary_skill = random.choice([s for s in self.SKILLS if s not in [primary_skill, secondary_skill]])

        # 2. Select Template
        template = random.choice(self.JD_TEMPLATES)
        jd_text = template.format(
            role=jd_role,
            company=jd_company,
            skill_1=primary_skill,
            skill_2=secondary_skill,
            skill_3=tertiary_skill
        )

        # 3. Determine Match Quality (High/Mid/Low)
        match_quality = random.choices(["high", "medium", "low"], weights=[0.4, 0.3, 0.3])[0]

        # 4. Generate Profile based on Match Quality
        if match_quality == "high":
            # Resume has the role + primary + secondary skills
            profile_data = self._generate_clean_profile_data(
                override_skills=[primary_skill, secondary_skill, tertiary_skill],
                override_role=jd_role
            )
            score = random.randint(88, 98)
            reasoning = (
                f"Excellent match. The candidate is a current {jd_role} with strong experience in "
                f"{primary_skill} and {secondary_skill}, directly aligning with the job requirements."
            )
            missing = []
            
        elif match_quality == "medium":
            # Resume has role + primary, but misses secondary
            profile_data = self._generate_clean_profile_data(
                override_skills=[primary_skill], # Missing secondary/tertiary
                override_role=jd_role
            )
            score = random.randint(65, 78)
            reasoning = (
                f"Good potential. Candidate has the required core skill ({primary_skill}) and job title, "
                f"but lacks experience in {secondary_skill}, which is a key requirement."
            )
            missing = [secondary_skill]
            
        else: # Low match
            # Resume has wrong role and misses primary skill
            wrong_skill = random.choice([s for s in self.SKILLS if s != primary_skill])
            profile_data = self._generate_clean_profile_data(
                override_skills=[wrong_skill],
                override_role="Intern" if jd_role != "Intern" else "Manager"
            )
            score = random.randint(30, 55)
            reasoning = (
                f"Weak match. The candidate lacks the essential skill ({primary_skill}) and does not "
                f"have the required seniority level for this {jd_role} position."
            )
            missing = [primary_skill, secondary_skill]

        # 5. Construct Response
        assistant_response = {
            "score": score,
            "reasoning": reasoning,
            "missing_critical_skills": missing
        }

        # 6. Format Input (Full Profile JSON + Raw JD)
        # We dump the whole profile to ensure the model learns to read the full context
        user_content = f"PROFILE JSON: {json.dumps(profile_data)} \n\n TARGET JOB DESCRIPTION: \n{jd_text}"

        return {
            "messages": [
                {"role": self.ROLE_SYSTEM, "content": self.SYSTEM_PROMPT_SCORING},
                {"role": self.ROLE_USER, "content": user_content},
                {"role": self.ROLE_ASSISTANT, "content": json.dumps(assistant_response)}
            ]
        }

    # --- Task C: Tailoring (Resume Architect Version) ---
    def _create_tailoring_example(self) -> Dict:
        """
        Generates a Resume Tailoring example.
        Randomly toggles between 'Has Experience' and 'Fresher' to teach layout rules.
        """
        # 1. Decide: Fresher or Experienced?
        has_experience = random.choice([True, False])
        
        # 2. Generate Profile (Using standard helper + Manual Tweak for Fresher)
        profile_data = self._generate_clean_profile_data()
        
        if not has_experience:
            profile_data['experience'] = [] # FORCE EMPTY
            profile_data['professional_summary'] = "Aspiring Developer looking for entry level roles."
        
        # 3. Generate Target JD
        jd = random.choice(self.JD_TEMPLATES).format(
            role=profile_data['personal_details']['job_title'], 
            company=random.choice(self.COMPANIES),
            skill_1=profile_data['skills'][0],
            skill_2=profile_data['skills'][1],
            skill_3="Docker"
        )

        # 4. Generate the PERFECT Resume Text (Ground Truth)
        tailored_resume_text = self._generate_tailored_resume_text(profile_data)

        # 5. Construct ChatML
        user_content = f"PROFILE JSON: {json.dumps(profile_data)} \n\n TARGET JOB DESCRIPTION: \n{jd}"

        return {
            "messages": [
                {"role": self.ROLE_SYSTEM, "content": self.SYSTEM_PROMPT_TAILORING},
                {"role": self.ROLE_USER, "content": user_content},
                {"role": self.ROLE_ASSISTANT, "content": tailored_resume_text}
            ]
        }

    # --- Main Loop ---
    def generate(self):
        logger.info(f"Generating {self.NUM_SAMPLES} samples...")
        for _ in range(self.NUM_SAMPLES):
            r = random.random()
            # Adjusted Ratios: 45% Parsing, 45% Scoring, 10% Tailoring
            if r < 0.45: sample = self._create_parsing_example()
            elif r < 0.90: sample = self._create_scoring_example()
            else: sample = self._create_tailoring_example()
            
            self.samples.append(json.dumps(sample))

        with open(self.OUTPUT_FILE, "w", encoding="utf-8") as f:
            for line in self.samples:
                f.write(line + "\n")
        logger.info(f"Done. Saved to {self.OUTPUT_FILE}")

if __name__ == "__main__":
    gen = DatasetGenerator()
    gen.generate()