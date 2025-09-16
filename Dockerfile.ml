# ML Algorithm Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY ml-algorithm/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY ml-algorithm/src src

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "-m", "uvicorn", "src.trading.inference_service:app", "--host", "0.0.0.0", "--port", "8000"]
