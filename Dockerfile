FROM python:3.11-slim

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

COPY --chown=user requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt

COPY --chown=user artifacts/api-server/ .
COPY --chown=user init_db.sql .
COPY --chown=user init_db.py .

ENV PYTHONPATH=/app
ENV DATABASE_URL=sqlite:////app/data/sigmon.db
ENV DB_PATH=/app/data/sigmon.db

RUN mkdir -p /app/data

CMD ["sh", "-c", "python init_db.py && uvicorn main:app --host 0.0.0.0 --port 7860"]
