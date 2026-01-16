FROM python:3.12-slim

# Install system dependencies for PostgreSQL + compilation + Redis
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app


# Copy requirements (cache optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 7860

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# Run with start script
RUN chmod +x start.sh
CMD ["./start.sh"]
