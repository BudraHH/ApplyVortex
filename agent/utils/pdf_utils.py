import logging
import io
import os
from pypdf import PdfReader
from typing import Union

logger = logging.getLogger(__name__)

def extract_text_from_pdf(source: Union[str, bytes]) -> str:
    """
    Extracts raw text from a PDF source.
    
    Args:
        source: A file path (str) OR raw file bytes (bytes).
        
    Returns:
        Cleaned raw string ready for Qwen AI.
        
    Raises:
        ValueError: If the file is not a valid PDF or is unreadable.
    """
    try:
        # 1. Normalize Input to a File-like Object
        if isinstance(source, str):
            if not source.lower().endswith(".pdf"):
                raise ValueError(f"Invalid file type: {source}. Only .pdf is allowed.")
            reader = PdfReader(source)
        elif isinstance(source, bytes):
            # Check PDF magic number signature (%PDF) to prevent non-PDF processing
            if not source.startswith(b'%PDF'):
                raise ValueError("File bytes missing PDF signature. Invalid format.")
            reader = PdfReader(io.BytesIO(source))
        else:
            raise TypeError("Source must be a file path (str) or raw bytes.")

        # 2. Extract Text Page by Page
        text_content = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                text_content.append(text)
            else:
                logger.warning(f"Page {i+1} yielded no text. It might be an image.")

        # 3. Combine
        full_text = "\n".join(text_content).strip()

        # 4. Safety Check for Scanned Documents
        if not full_text:
            raise ValueError("PDF content is empty. This appears to be a scanned image/photo, which is not supported.")

        return full_text

    except Exception as e:
        logger.error(f"PDF Extraction Failed: {e}")
        # Re-raise so the Agent knows to mark the task as FAILED
        raise ValueError(f"Could not process PDF: {str(e)}")