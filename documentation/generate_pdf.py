#!/usr/bin/env python3
"""
Generate PDF documentation for ApplyVortex from markdown source.
Simplified version using ReportLab with proper HTML escaping.
"""

import os
import sys
import re
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors

def escape_html(text):
    """Escape HTML special characters."""
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    return text

def process_inline_markdown(text):
    """Convert inline markdown to HTML, properly escaping content."""
    # First escape HTML
    text = escape_html(text)
    
    # Handle bold (**text**)
    text = re.sub(r'\*\*([^\*]+)\*\*', r'<b>\1</b>', text)
    
    # Handle inline code (`text`)
    text = re.sub(r'`([^`]+)`', r'<font name="Courier" color="#c7254e" size="9">\1</font>', text)
    
    return text

def read_markdown(filepath):
    """Read markdown file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def markdown_to_pdf(markdown_text, output_path):
    """Convert markdown text to PDF using ReportLab."""
    
    # Create PDF document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    h1_style = ParagraphStyle(
        'CustomH1',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#2c3e50'),
        spaceAfter=10,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    )
    
    h2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=colors.HexColor('#34495e'),
        spaceAfter=8,
        spaceBefore=8,
        fontName='Helvetica-Bold'
    )
    
    h3_style = ParagraphStyle(
        'CustomH3',
        parent=styles['Heading3'],
        fontSize=11,
        textColor=colors.HexColor('#34495e'),
        spaceAfter=6,
        spaceBefore=6,
        fontName='Helvetica-Bold'
    )
    
    h4_style = ParagraphStyle(
        'CustomH4',
        parent=styles['Heading4'],
        fontSize=10,
        textColor=colors.HexColor('#34495e'),
        spaceAfter=4,
        spaceBefore=4,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=9,
        textColor=colors.HexColor('#333333'),
        spaceAfter=4,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )
    
    code_style = ParagraphStyle(
        'CustomCode',
        parent=styles['Code'],
        fontSize=7,
        textColor=colors.HexColor('#333333'),
        fontName='Courier',
        leftIndent=15,
        spaceAfter=4,
        spaceBefore=4
    )
    
    # Parse markdown line by line
    lines = markdown_text.split('\n')
    i = 0
    in_code_block = False
    code_block_lines = []
    skip_until_code_end = False
    
    while i < len(lines):
        line = lines[i].rstrip()
        
        # Handle code blocks
        if line.startswith('```'):
            if in_code_block:
                # End of code block
                if not skip_until_code_end and code_block_lines:
                    code_text = '\n'.join(code_block_lines[:30])  # Limit code block size
                    if len(code_block_lines) > 30:
                        code_text += '\n... (truncated)'
                    try:
                        elements.append(Preformatted(code_text, code_style))
                    except:
                        pass  # Skip problematic code blocks
                code_block_lines = []
                in_code_block = False
                skip_until_code_end = False
            else:
                # Start of code block
                in_code_block = True
                # Check if it's a diagram (skip these)
                if 'mermaid' in line or (i + 1 < len(lines) and ('graph' in lines[i+1] or 'sequenceDiagram' in lines[i+1])):
                    skip_until_code_end = True
            i += 1
            continue
        
        if in_code_block:
            if not skip_until_code_end:
                code_block_lines.append(line)
            i += 1
            continue
        
        # Skip empty lines
        if not line:
            elements.append(Spacer(1, 0.05*inch))
            i += 1
            continue
        
        # Handle headers
        if line.startswith('# '):
            text = line[2:].strip()
            if i < 5:  # First few lines might be title
                elements.append(Paragraph(text, title_style))
                elements.append(Spacer(1, 0.2*inch))
            else:
                elements.append(Spacer(1, 0.15*inch))
                elements.append(Paragraph(escape_html(text), h1_style))
        elif line.startswith('## '):
            text = line[3:].strip()
            elements.append(Paragraph(escape_html(text), h2_style))
        elif line.startswith('### '):
            text = line[4:].strip()
            elements.append(Paragraph(escape_html(text), h3_style))
        elif line.startswith('#### '):
            text = line[5:].strip()
            elements.append(Paragraph(escape_html(text), h4_style))
        
        # Handle horizontal rules
        elif line.startswith('---'):
            elements.append(Spacer(1, 0.1*inch))
        
        # Handle lists
        elif line.startswith('- ') or line.startswith('* '):
            text = line[2:].strip()
            text = process_inline_markdown(text)
            try:
                elements.append(Paragraph(f'• {text}', body_style))
            except:
                elements.append(Paragraph(f'• {escape_html(line[2:].strip())}', body_style))
        
        elif re.match(r'^\d+\.', line):
            # Numbered list
            text = re.sub(r'^\d+\.\s*', '', line)
            text = process_inline_markdown(text)
            try:
                elements.append(Paragraph(text, body_style))
            except:
                elements.append(Paragraph(escape_html(text), body_style))
        
        # Handle regular paragraphs
        else:
            # Skip table of contents links
            if line.strip().startswith('[') and '](#' in line:
                i += 1
                continue
            
            text = process_inline_markdown(line)
            
            if text.strip():
                try:
                    elements.append(Paragraph(text, body_style))
                except Exception as e:
                    # Fallback: just use plain text
                    try:
                        elements.append(Paragraph(escape_html(line), body_style))
                    except:
                        pass  # Skip problematic lines
        
        i += 1
    
    # Add footer
    elements.append(Spacer(1, 0.3*inch))
    footer_text = f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')}"
    elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=TA_CENTER)))
    
    # Build PDF
    print(f"Building PDF with {len(elements)} elements...")
    try:
        doc.build(elements)
        print(f"✓ PDF created successfully: {output_path}")
        return True
    except Exception as e:
        print(f"✗ Error building PDF: {e}")
        return False

def main():
    # Paths
    markdown_file = "/home/budrahh/.gemini/antigravity/brain/15812b8d-0be6-42e9-a81b-b06207369ca4/applyvortex_overview.md"
    output_file = "/home/budrahh/Projects/applyvortex/documentation/ApplyVortex_Documentation.pdf"
    
    print("=" * 60)
    print("ApplyVortex Documentation PDF Generator")
    print("=" * 60)
    
    # Check if markdown file exists
    if not os.path.exists(markdown_file):
        print(f"✗ Error: Markdown file not found: {markdown_file}")
        sys.exit(1)
    
    print(f"✓ Reading markdown from: {markdown_file}")
    markdown_text = read_markdown(markdown_file)
    print(f"✓ Loaded {len(markdown_text)} characters")
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Generate PDF
    print(f"✓ Generating PDF: {output_file}")
    success = markdown_to_pdf(markdown_text, output_file)
    
    if success:
        # Check file size
        file_size = os.path.getsize(output_file)
        print(f"✓ PDF size: {file_size / 1024:.2f} KB")
        print("=" * 60)
        print("✓ Documentation PDF generated successfully!")
        print("=" * 60)
    else:
        print("=" * 60)
        print("✗ PDF generation failed")
        print("=" * 60)
        sys.exit(1)

if __name__ == "__main__":
    main()
