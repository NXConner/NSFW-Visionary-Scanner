# syntax=docker/dockerfile:1

########################
# Build stage (Vite)    #
########################
FROM node:20-bookworm-slim AS build

WORKDIR /app

# Avoid running git hooks inside Docker builds.
ENV HUSKY=0

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite env (build-time). These are NOT secrets; they are embedded into the client bundle.
# Keep them optional so the image can be built without passing every arg.
ARG VITE_APP_ENV=production
ARG VITE_APP_VERSION=nsfw
ARG VITE_DISTRIBUTION_CHANNEL=direct
ARG VITE_CONTENT_POLICY=nsfw
ARG VITE_FEATURE_FLAGS={}
ARG VITE_FORCE_SW_CLEANUP=false

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_CLIENT_ENCRYPTION_SALT
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_SENTRY_DSN

ARG VITE_ADMIN_EMAIL
ARG VITE_ADMIN_SUPER_EMAIL
ARG VITE_ADDITIONAL_ADMINS

ENV NODE_ENV=production
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_DISTRIBUTION_CHANNEL=$VITE_DISTRIBUTION_CHANNEL
ENV VITE_CONTENT_POLICY=$VITE_CONTENT_POLICY
ENV VITE_FEATURE_FLAGS=$VITE_FEATURE_FLAGS
ENV VITE_FORCE_SW_CLEANUP=$VITE_FORCE_SW_CLEANUP

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_CLIENT_ENCRYPTION_SALT=$VITE_CLIENT_ENCRYPTION_SALT
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

ENV VITE_ADMIN_EMAIL=$VITE_ADMIN_EMAIL
ENV VITE_ADMIN_SUPER_EMAIL=$VITE_ADMIN_SUPER_EMAIL
ENV VITE_ADDITIONAL_ADMINS=$VITE_ADDITIONAL_ADMINS

RUN npm run build

########################
# Runtime stage (nginx) #
########################
FROM nginx:1.27-alpine AS runtime

# Replace the default server config with SPA-friendly routing.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
