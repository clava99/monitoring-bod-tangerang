# ═══════════════════════════════════════════════════
# Stage 1: Build React frontend dengan Node.js
# ═══════════════════════════════════════════════════
FROM node:22-slim AS frontend-builder

RUN npm install -g pnpm@latest

WORKDIR /build

COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./
COPY package.json ./
COPY tsconfig.base.json ./
COPY tsconfig.json ./

COPY lib/ ./lib/

WORKDIR /build/artifacts/sigmon
COPY artifacts/sigmon/package.json ./

WORKDIR /build
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

WORKDIR /build/artifacts/sigmon
COPY artifacts/sigmon/ ./
RUN pnpm build

# ═══════════════════════════════════════════════════
# Stage 2: Python FastAPI server + hasil build React
# ═══════════════════════════════════════════════════
FROM python:3.11-slim

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=user artifacts/api-server/ .

COPY --chown=user --from=frontend-builder /build/artifacts/api-server/static ./static

COPY --chown=user init_db.sql .
COPY --chown=user init_db.py .

ENV PYTHONPATH=/app

CMD ["sh", "-c", "python init_db.py && uvicorn main:app --host 0.0.0.0 --port 7860"]
