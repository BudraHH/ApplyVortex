"""Service for generating ATS-friendly resumes in PDF format."""

import logging
import io
from typing import Dict, Any, List
from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.enums import TA_LEFT, TA_CENTER

logger = logging.getLogger(__name__)

class PDFResumeService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_styles()

    def _setup_styles(self):
        """Configure standard ATS-friendly styles."""
        self.styles.add(ParagraphStyle(
            name='ATS_Header',
            fontSize=16,
            leading=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            spaceAfter=2
        ))
        self.styles.add(ParagraphStyle(
            name='ATS_Subheader',
            fontSize=10,
            leading=12,
            alignment=TA_CENTER,
            fontName='Helvetica',
            spaceAfter=10
        ))
        self.styles.add(ParagraphStyle(
            name='ATS_SectionTitle',
            fontSize=12,
            leading=14,
            fontName='Helvetica-Bold',
            spaceBefore=12,
            spaceAfter=6,
            borderPadding=(0, 0, 1, 0),
            borderWidth=0,
            borderColor=colors.black
        ))
        self.styles.add(ParagraphStyle(
            name='ATS_BodyBold',
            fontSize=10,
            leading=12,
            fontName='Helvetica-Bold'
        ))
        self.styles.add(ParagraphStyle(
            name='ATS_Body',
            fontSize=10,
            leading=12,
            fontName='Helvetica',
            alignment=TA_LEFT,
            spaceAfter=4
        ))

    def generate_resume_pdf(self, profile_data: Dict[str, Any]) -> bytes:
        """
        Creates a single-column, ATS-friendly PDF from profile/resume data.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=LETTER,
            rightMargin=50,
            leftMargin=50,
            topMargin=50,
            bottomMargin=50
        )

        elements = []

        # 1. Header (Name & Contact)
        full_name = profile_data.get("full_name", "Your Name")
        elements.append(Paragraph(full_name.upper(), self.styles['ATS_Header']))
        
        contact_info = []
        if profile_data.get("email"): contact_info.append(profile_data["email"])
        if profile_data.get("phone"): contact_info.append(profile_data["phone"])
        if profile_data.get("location"): contact_info.append(profile_data["location"])
        
        elements.append(Paragraph(" | ".join(contact_info), self.styles['ATS_Subheader']))
        
        links = []
        if profile_data.get("linkedin_url"): links.append("LinkedIn")
        if profile_data.get("github_url"): links.append("GitHub")
        if profile_data.get("portfolio_url"): links.append("Portfolio")
        if links:
             elements.append(Paragraph(" | ".join(links), self.styles['ATS_Subheader']))

        # 2. Professional Summary
        if profile_data.get("summary"):
            elements.append(Paragraph("PROFESSIONAL SUMMARY", self.styles['ATS_SectionTitle']))
            elements.append(Paragraph(profile_data["summary"], self.styles['ATS_Body']))

        # 3. Skills
        if profile_data.get("skills"):
            elements.append(Paragraph("TECHNICAL SKILLS", self.styles['ATS_SectionTitle']))
            skills_text = ", ".join(profile_data["skills"])
            elements.append(Paragraph(skills_text, self.styles['ATS_Body']))

        # 4. Experience
        if profile_data.get("experience"):
            elements.append(Paragraph("WORK EXPERIENCE", self.styles['ATS_SectionTitle']))
            for job in profile_data["experience"]:
                title_line = f"<b>{job.get('title', 'Position')}</b> | {job.get('company', 'Company')}"
                elements.append(Paragraph(title_line, self.styles['ATS_Body']))
                
                date_line = f"<i>{job.get('duration', '')}</i>"
                elements.append(Paragraph(date_line, self.styles['ATS_Body']))
                
                desc = job.get('description', '')
                if isinstance(desc, list):
                    bullet_points = [ListItem(Paragraph(p, self.styles['ATS_Body'])) for p in desc]
                    elements.append(ListFlowable(bullet_points, bulletType='bullet', leftIndent=20))
                else:
                    elements.append(Paragraph(desc, self.styles['ATS_Body']))
                
                elements.append(Spacer(1, 6))

        # 5. Projects
        if profile_data.get("projects"):
            elements.append(Paragraph("PROJECTS", self.styles['ATS_SectionTitle']))
            for proj in profile_data["projects"]:
                elements.append(Paragraph(f"<b>{proj.get('name', 'Project')}</b>", self.styles['ATS_Body']))
                elements.append(Paragraph(proj.get('description', ''), self.styles['ATS_Body']))
                elements.append(Spacer(1, 4))

        # 6. Education
        if profile_data.get("education"):
            elements.append(Paragraph("EDUCATION", self.styles['ATS_SectionTitle']))
            for edu in profile_data["education"]:
                edu_line = f"<b>{edu.get('degree', 'Degree')}</b>, {edu.get('institution', 'University')}"
                elements.append(Paragraph(edu_line, self.styles['ATS_Body']))
                elements.append(Paragraph(f"Graduated: {edu.get('year', '')}", self.styles['ATS_Body']))

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

# Global instance
pdf_resume_service = PDFResumeService()
