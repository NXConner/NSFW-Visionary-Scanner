# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
ENV NODE_ENV=production
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --include=dev

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies to keep the runtime lean
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
