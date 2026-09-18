# Use official Python lightweight image
FROM python:3.11-slim

# Prevent Python from writing .pyc files & buffer output
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies (Tesseract OCR is critical for the AI extraction)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Start command: Run migrations, seed the database with rules, and start the FastAPI server
CMD ["sh", "-c", "alembic -c migrations/alembic.ini upgrade head && python -m app.scripts.seed_database && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
