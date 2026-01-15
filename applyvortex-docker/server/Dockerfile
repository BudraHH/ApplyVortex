FROM python:3.12-slim

# Install system dependencies for PostgreSQL + compilation + Playwright
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    # Playwright dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first (cache optimization)
# Install Playwright package first to install browsers
RUN pip install playwright

# Install Playwright chromium browser (Now decoupled from requirements.txt)
RUN playwright install chromium

# Copy requirements (cache optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model for NLP tasks
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with uvicorn (production settings)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
