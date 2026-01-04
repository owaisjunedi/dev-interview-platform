# Stage 1: Build the frontend
FROM node:20-slim AS build-frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Final image
FROM python:3.12-slim
WORKDIR /app

# Install Nginx and other system dependencies
RUN apt-get update && apt-get install -y nginx curl procps && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy frontend build to Nginx html directory
COPY --from=build-frontend /app/client/dist /usr/share/nginx/html

# Copy backend code
COPY server /app/server
WORKDIR /app/server
RUN uv sync

# Copy Nginx config and startup script
COPY nginx.conf /etc/nginx/sites-available/default
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
# Remove the default symlink if it exists and points elsewhere
RUN rm -f /etc/nginx/sites-enabled/default && ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Force a change to break cache for start.sh
RUN echo "# Cache breaker $(date)" >> /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
