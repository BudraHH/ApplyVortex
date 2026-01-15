# ==========================================
# STAGE 1: Base (Dependencies)
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ==========================================
# STAGE 2: Development (Hot Reloading)
# ==========================================
# This stage keeps Node.js and just runs the dev server
FROM base AS development
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ==========================================
# STAGE 3: Builder (Compiles for Prod)
# ==========================================
FROM base AS builder
COPY . .
RUN npm run build

# ==========================================
# STAGE 4: Production (Nginx)
# ==========================================
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Redirect logs
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
