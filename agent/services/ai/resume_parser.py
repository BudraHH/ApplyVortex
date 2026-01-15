
from agent.services.ai.base import LocalAIBaseService
import logging

logger = logging.getLogger(__name__)

class ResumeParsingService(LocalAIBaseService):
    """Service for interacting with Local AI for Resume Parsing."""
    
    PARSE_PROMPT_TEMPLATE = """
    SYSTEM ROLE:
    You are an enterprise-grade Resume Parsing and Normalization Engine designed for ATS, HRIS, and Talent Intelligence platforms.
    Your output MUST be deterministic, schema-compliant, and production-ready.

    TASK:
    Parse the provided resume text and convert it into a STRICTLY VALID JSON object that conforms EXACTLY to the required schema below.
    This output will be ingested directly into a professional profile database — ANY deviation, missing field, malformed date, or extra text is unacceptable.

    INPUT:
    CANDIDATE RESUME TEXT:
    {text}

    HARD RULES (NON-NEGOTIABLE):

    1. OUTPUT ONLY RAW JSON.
    - No explanations, no markdown, no comments, no code fences.
    - No trailing text before or after JSON.
    - If JSON is invalid → response is considered FAILED.

    2. SCHEMA COMPLIANCE:
    - Every field in the schema MUST exist.
    - If data is missing → use null for strings/objects, [] for arrays.
    - Do NOT omit any key under any circumstance.

    3. DATE NORMALIZATION:
    - Use ISO format only:
    - YYYY-MM-DD if exact date exists
    - YYYY-MM if only month/year exists
    - If currently ongoing:
    - end_date = null
    - current / is_ongoing = true

    4. NAME PARSING (CRITICAL):
    - Carefully split the candidate’s full name.
    - Example 1:
    Full Name: "Hari Hara Budra"
    → first_name = "Hari"
    → middle_name = "Hara"
    → last_name = "Budra"
    - Example 2:
    Full Name: "Hari Hara Budra P"
    → first_name = "Hari"
    → middle_name = "Hara"
    → last_name = "Budra P"
    - Never drop initials, suffixes, or trailing name parts.
    - Example 3:
    Full Name: "Hari Hara"
    → first_name = "Hari"
    → middle_name = ""
    → last_name = "Hara"
    - Example 4:
    Full Name: "Hari"
    → first_name = "Hari"
    → middle_name = ""
    → last_name = ""

    5. LOCATION INFERENCE (MANDATORY):
    - If a city is mentioned, you MUST infer:
    - State
    - Country
    - Example:
    Chennai → Tamil Nadu → India
    - Never leave state or country null if city is known.

    6. EXPERIENCE & PROJECT DESCRIPTIONS (VERY IMPORTANT):
    - The "description" field MUST contain AT LEAST 5 bullet points.
    - Each bullet MUST:
    - Start with the bullet character: •
    - Be technically detailed
    - Mention tools, architecture, scale, impact, or responsibilities
    - Do NOT lightly summarize or compress technical depth.

    7. PROJECT SHORT DESCRIPTION:
    - EXACTLY 2 professional lines
    - No bullets
    - No more, no less
    - Resume-grade language only

    8. PROJECT DATES:
    - start_date and end_date are MANDATORY
    - If ongoing:
    - is_ongoing = true
    - end_date = null

    9. SKILLS EXTRACTION:
    - Extract ALL skills:
    - Programming languages
    - Frameworks
    - Tools
    - Databases
    - Cloud platforms
    - DevOps
    - Soft skills (if present)
    - Return as a FLAT ARRAY of STRINGS
    - No categorization, no nesting, no duplicates.

    10. COMPLETENESS GUARANTEE:
    - Do NOT skip sections appearing at the end of the resume:
      - Certifications
      - Achievements
      - Accomplishments
      - Research
    - If mentioned → MUST be extracted.

    11. DATA FIDELITY:
    - Do NOT hallucinate companies, projects, degrees, or certifications.
    - Only extract what is present or logically inferable (location only).

    12. EMPLOYMENT TYPE NORMALIZATION:
    - Normalize to EXACTLY one of:
    - Full-time
    - Part-time
    - Internship
    - Contract

    13. REQUIRED OUTPUT SCHEMA (STRICT):
    {
      "personal_details": {
        "first_name": "String",
        "middle_name": "String (or empty)",
        "last_name": "String",
        "email": "String",
        "phone": "String",
        "linkedin_url": "String",
        "github_url": "String",
        "portfolio_url": "String",
        "professional_summary": "String",
        "job_title": "String",
        "location": {{
          "city": "String",
          "state": "String",
          "country": "String"
        }}
      }},
      "education": [
        {{
          "institution": "String",
          "university": "String",
          "degree": "String",
          "field_of_study": "String",
          "start_date": "YYYY-MM",
          "end_date": "YYYY-MM",
          "current": Boolean,
          "location": {{ "city": "String", "state": "String", "country": "String" }},
          "gpa": "String",
          "grade_type": "String",
          "description": "String",
          "relevant_coursework": ["String"],
          "honors_awards": ["String"],
          "thesis_title": "String",
          "thesis_description": "String",
          "research_areas": ["String"],
          "publications": ["String"]
        }}
      ],
      "experience": [
        {{
          "company": "String",
          "title": "String",
          "start_date": "YYYY-MM",
          "end_date": "YYYY-MM or null",
          "current": Boolean,
          "location": {{ "city": "String", "state": "String", "country": "String" }},
          "description": "Array of strings or single string",
          "achievements": ["String"],
          "skills_used": ["String"],
          "employment_type": "String"
        }}
      ],
      "projects": [
        {{
          "name": "String",
          "short_description": "String",
          "description": "String",
          "url": "String",
          "github_url": "String",
          "start_date": "YYYY-MM",
          "end_date": "YYYY-MM or null",
          "is_ongoing": Boolean,
          "skills_used": ["String"]
        }}
      ],
      "skills": ["String"],
      "certifications": [
        {{
          "name": "String",
          "issuer": "String",
          "date": "YYYY-MM",
          "url": "String"
        }}
      ],
      "languages": ["String"],
      "research": [
        {{
          "title": "String",
          "authors": "String",
          "publisher": "String",
          "publication_date": "YYYY-MM",
          "url": "String",
          "abstract": "String"
        }}
      ],
      "accomplishments": [
        {{
          "title": "String",
          "description": "String",
          "category": "String"
        }}
      ]
    }

    FORMAT LEARNING EXAMPLE (STRICTLY FOR FORMAT — DO NOT COPY CONTENT):
    The following example is provided ONLY to demonstrate structure, depth, and formatting.
    DO NOT reuse names, companies, skills, dates, descriptions, or achievements from this example.
    ONLY apply the format and rules to the real input resume.

    --- BEGIN EXAMPLE RESUME ---
    ALEX J. MERCER
    Austin, Texas | +1 (512) 555-0199 | alex.mercer.devops@example.com
    linkedin.com/in/alexmercer-cloud | github.com/amercer-ops

    PROFESSIONAL SUMMARY
    Senior DevOps Engineer with 6+ years of experience architecting scalable cloud infrastructure and automating CI/CD pipelines
    for high-volume SaaS platforms. Expert in AWS, Kubernetes, Terraform, and Python. Proven track record of reducing
    deployment times by 60% and infrastructure costs by 40% through serverless adoption and container orchestration.
    Deep understanding of site reliability engineering (SRE) principles, observability (Prometheus/Grafana), and security compliance (SOC2).

    TECHNICAL SKILLS
    Cloud Platforms: AWS (EKS, Lambda, RDS, VPC, IAM), Google Cloud Platform (GCP)
    Containerization & Orchestration: Docker, Kubernetes (k8s), Helm, Istio
    Infrastructure as Code (IaC): Terraform, Ansible, CloudFormation
    CI/CD Tools: Jenkins, GitHub Actions, GitLab CI, ArgoCD
    Scripting & Programming: Python, Bash, Go, Groovy
    Monitoring & Logging: Prometheus, Grafana, ELK Stack, Datadog
    Databases: PostgreSQL, DynamoDB, Redis

    PROFESSIONAL EXPERIENCE

    CloudScale Innovations
    Senior DevOps Engineer
    Jan 2023 – Present
    Austin, TX
    * Architected and maintained a multi-region AWS infrastructure using Terraform, supporting 500k+ daily active users with 99.99% uptime.
    * Migrated legacy monolithic applications to microservices architecture on Amazon EKS, reducing compute costs by 35% annually.
    * Designed and implemented a GitOps-based CI/CD pipeline using ArgoCD and GitHub Actions, cutting deployment time from 2 hours to 15 minutes.
    * Hardened cluster security by implementing OPA Gatekeeper policies and scanning container images with Trivy, ensuring SOC2 type II compliance.
    * Developed custom Python automation scripts to auto-scale worker nodes based on custom metric triggers from Prometheus.
    * Conducted post-mortem analysis for incidents and implemented chaos engineering practices to improve system resilience.

    NexGen Data Systems
    Cloud Infrastructure Engineer
    Jun 2019 – Dec 2022
    Dallas, TX
    * Managed the migration of on-premise data centers to AWS, utilizing EC2, S3, and RDS, resulting in a 50% reduction in operational overhead.
    * Implemented centralized logging and monitoring solutions using the ELK stack and Datadog to provide real-time visibility into application health.
    * Automated database backup and disaster recovery procedures, reducing Recovery Time Objective (RTO) to under 10 minutes.
    * Collaborated with development teams to containerize Java and Node.js applications using Docker, standardizing development and production environments.
    * Mentored junior engineers on IaC best practices and conducted weekly code reviews for Terraform modules.

    KEY PROJECTS

    KubeGuard - Kubernetes Security Operator
    Aug 2023 – Present
    A lightweight, open-source Kubernetes operator designed to monitor and enforce real-time security policies across clusters.
    Currently used by 3 internal teams to audit pod security contexts and network policies.
    * Developed a custom Kubernetes Controller using Golang and Kubebuilder framework to watch for non-compliant pod deployments.
    * Integrated with Slack Webhooks to send real-time alerts to DevSecOps teams when security violations occur.
    * Implemented a mutating admission webhook to automatically patch security contexts for specific namespaces.
    * Wrote comprehensive unit tests and documentation, achieving 90% code coverage.
    * Configured a highly available deployment strategy ensuring the operator functions during cluster upgrades.

    AutoCost - AWS Cost Optimizer
    Feb 2021 – May 2021
    An automated serverless tool to identify and shut down underutilized AWS resources during non-business hours.
    Reduced development environment costs by roughly $2,000 per month.
    * Designed a serverless architecture using AWS Lambda (Python) and CloudWatch Events to trigger resource checks.
    * Integrated with AWS Cost Explorer API to generate weekly savings reports sent via SES email.
    * Implemented tag-based filtering to ensure production resources were never affected by automated shutdowns.
    * Deployed the entire stack using AWS SAM (Serverless Application Model) for easy replication across accounts.
    * Utilized DynamoDB to maintain a state file of resource uptime and shutdown history.

    EDUCATION
    Bachelor of Science in Computer Science
    University of Texas at Dallas
    Aug 2015 – May 2019
    GPA: 3.8/4.0
    Relevant Coursework: Distributed Systems, Cloud Computing, Network Security, Data Structures, Operating Systems.

    CERTIFICATIONS & ACHIEVEMENTS
    * Certified Kubernetes Administrator (CKA) - Cloud Native Computing Foundation (CNCF), 2023
    * AWS Certified Solutions Architect – Associate - Amazon Web Services, 2022
    * HackTexas 2018 Winner: Won 1st place for "IoT Smart Grid" project among 50+ teams.

    --- END EXAMPLE RESUME ---

    --- BEGIN EXAMPLE EXPECTED JSON ---
    {
      "personal_details": {
        "first_name": "Alex",
        "middle_name": "J.",
        "last_name": "Mercer",
        "email": "alex.mercer.devops@example.com",
        "phone": "+1 (512) 555-0199",
        "linkedin_url": "https://linkedin.com/in/alexmercer-cloud",
        "github_url": "https://github.com/amercer-ops",
        "portfolio_url": null,
        "professional_summary": "Senior DevOps Engineer with 6+ years of experience architecting scalable cloud infrastructure and automating CI/CD pipelines for high-volume SaaS platforms. Expert in AWS, Kubernetes, Terraform, and Python with a proven track record of reducing deployment times and infrastructure costs.",
        "job_title": "Senior DevOps Engineer",
        "location": {
          "city": "Austin",
          "state": "Texas",
          "country": "USA"
        }
      },
      "education": [
        {
          "institution": "University of Texas at Dallas",
          "university": "University of Texas at Dallas",
          "degree": "Bachelor of Science",
          "field_of_study": "Computer Science",
          "start_date": "2015-08",
          "end_date": "2019-05",
          "current": false,
          "location": {
            "city": "Dallas",
            "state": "Texas",
            "country": "USA"
          },
          "gpa": "3.8",
          "grade_type": "GPA",
          "description": "Completed undergraduate degree with a focus on Distributed Systems and Network Security.",
          "relevant_coursework": [
            "Distributed Systems",
            "Cloud Computing",
            "Network Security",
            "Data Structures",
            "Operating Systems"
          ],
          "honors_awards": [],
          "thesis_title": null,
          "thesis_description": null,
          "research_areas": [],
          "publications": []
        }
      ],
      "experience": [
        {
          "company": "CloudScale Innovations",
          "title": "Senior DevOps Engineer",
          "start_date": "2023-01",
          "end_date": null,
          "current": true,
          "location": {
            "city": "Austin",
            "state": "Texas",
            "country": "USA"
          },
          "description": "• Architected and maintained a multi-region AWS infrastructure using Terraform supporting 500k+ daily active users.\n• Migrated legacy monolithic applications to microservices architecture on Amazon EKS reducing compute costs by 35%.\n• Designed and implemented a GitOps-based CI/CD pipeline using ArgoCD and GitHub Actions cutting deployment time significantly.\n• Hardened cluster security by implementing OPA Gatekeeper policies and scanning container images ensuring SOC2 compliance.\n• Developed custom Python automation scripts to auto-scale worker nodes based on custom metric triggers.\n• Conducted post-mortem analysis for incidents and implemented chaos engineering practices.",
          "achievements": [
            "Reduced deployment time from 2 hours to 15 minutes",
            "Reduced compute costs by 35% annually",
            "Achieved 99.99% uptime"
          ],
          "skills_used": [
            "AWS",
            "Terraform",
            "Kubernetes",
            "EKS",
            "ArgoCD",
            "GitHub Actions",
            "Python",
            "Prometheus"
          ],
          "employment_type": "Full-time"
        },
        {
          "company": "NexGen Data Systems",
          "title": "Cloud Infrastructure Engineer",
          "start_date": "2019-06",
          "end_date": "2022-12",
          "current": false,
          "location": {
            "city": "Dallas",
            "state": "Texas",
            "country": "USA"
          },
          "description": "• Managed the migration of on-premise data centers to AWS utilizing EC2, S3, and RDS.\n• Implemented centralized logging and monitoring solutions using the ELK stack and Datadog.\n• Automated database backup and disaster recovery procedures reducing RTO to under 10 minutes.\n• Collaborated with development teams to containerize Java and Node.js applications using Docker.\n• Mentored junior engineers on IaC best practices and conducted weekly code reviews.",
          "achievements": [
            "Reduced operational overhead by 50%",
            "Reduced Recovery Time Objective (RTO) to under 10 minutes"
          ],
          "skills_used": [
            "AWS",
            "EC2",
            "ELK Stack",
            "Datadog",
            "Docker",
            "Java",
            "Node.js"
          ],
          "employment_type": "Full-time"
        }
      ],
      "projects": [
        {
          "name": "KubeGuard - Kubernetes Security Operator",
          "short_description": "A lightweight, open-source Kubernetes operator for monitoring security policies.\nCurrently used by internal teams to audit pod security contexts.",
          "description": "• Developed a custom Kubernetes Controller using Golang and Kubebuilder framework.\n• Integrated with Slack Webhooks to send real-time alerts to DevSecOps teams.\n• Implemented a mutating admission webhook to automatically patch security contexts.\n• Wrote comprehensive unit tests and documentation achieving 90% code coverage.\n• Configured a highly available deployment strategy ensuring the operator functions during upgrades.",
          "url": null,
          "github_url": null,
          "start_date": "2023-08",
          "end_date": null,
          "is_ongoing": true,
          "skills_used": [
            "Golang",
            "Kubernetes",
            "Kubebuilder",
            "Slack API",
            "DevSecOps"
          ]
        },
        {
          "name": "AutoCost - AWS Cost Optimizer",
          "short_description": "An automated serverless tool to shut down underutilized AWS resources.\nReduced development environment costs by roughly $2,000 per month.",
          "description": "• Designed a serverless architecture using AWS Lambda and CloudWatch Events.\n• Integrated with AWS Cost Explorer API to generate weekly savings reports.\n• Implemented tag-based filtering to ensure production resources were protected.\n• Deployed the entire stack using AWS SAM for easy replication.\n• Utilized DynamoDB to maintain a state file of resource uptime.",
          "url": null,
          "github_url": null,
          "start_date": "2021-02",
          "end_date": "2021-05",
          "is_ongoing": false,
          "skills_used": [
            "AWS Lambda",
            "Python",
            "CloudWatch",
            "AWS SAM",
            "DynamoDB"
          ]
        }
      ],
      "skills": [
        "AWS",
        "GCP",
        "Docker",
        "Kubernetes",
        "Helm",
        "Istio",
        "Terraform",
        "Ansible",
        "CloudFormation",
        "Jenkins",
        "GitHub Actions",
        "GitLab CI",
        "ArgoCD",
        "Python",
        "Bash",
        "Go",
        "Groovy",
        "Prometheus",
        "Grafana",
        "ELK Stack",
        "Datadog",
        "PostgreSQL",
        "DynamoDB",
        "Redis"
      ],
      "certifications": [
        {
          "name": "Certified Kubernetes Administrator (CKA)",
          "issuer": "Cloud Native Computing Foundation",
          "date": "2023-01",
          "url": null
        },
        {
          "name": "AWS Certified Solutions Architect – Associate",
          "issuer": "Amazon Web Services",
          "date": "2022-01",
          "url": null
        }
      ],
      "languages": [],
      "research": [],
      "accomplishments": [
        {
          "title": "HackTexas 2018 Winner",
          "description": "Won 1st place for 'IoT Smart Grid' project among 50+ teams at HackTexas 2018.",
          "category": "Award"
        }
      ]
    }
    --- END EXAMPLE EXPECTED JSON ---

    FINAL INSTRUCTION:
    Analyze the "INPUT RESUME TEXT" and return the JSON object.
    Return ONLY the JSON object.
    Any text outside JSON, missing keys, weak descriptions, incorrect bullets, or schema violations result in FAILURE.
    """

    def __init__(self):
        super().__init__(
            system_prompt="You are an enterprise-grade data extraction engine. You must parse resume text INTO STRICTLY VALID JSON. DO NOT explain. DO NOT use markdown. ONLY RAW JSON."
        )

    async def parse_resume_text(self, text: str) -> dict:
        """Parse raw resume text into structured JSON."""
        prompt = self.PARSE_PROMPT_TEMPLATE.format(text=text[:12000]) # Local LLMs can handle context
        return await self.generate_json(prompt, max_tokens=8192, response_format={"type": "json_object"})

resume_parsing_service = ResumeParsingService()
