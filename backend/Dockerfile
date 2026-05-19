# ---- Build stage ----
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files and install production deps only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nodeuser

# Copy installed deps and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Cloud Run injects PORT env var — default to 8080
ENV PORT=8080
ENV NODE_ENV=production

USER nodeuser

EXPOSE 8080

CMD ["node", "server.js"]
