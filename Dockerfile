# Discover Spain web app: production image built from the Next.js "standalone" output.
#
# Supabase is NOT in this image. Run it with the Supabase CLI (`npm run db:start`), which uses its
# own Docker containers, or use a hosted Supabase project. The app is pointed at it with:
#
#   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (build args, required)
#       Next.js inlines NEXT_PUBLIC_* values into the JavaScript at build time, so they must be
#       set when the image is built, and the URL must be reachable from the visitor's browser.
#   SUPABASE_URL  (runtime env, optional)
#       Server-side address of the same Supabase, when it differs from the browser's. Inside a
#       container, 127.0.0.1 is the container itself, so for the local CLI stack use
#       http://host.docker.internal:54321.
#
# docker-compose.yml sets all of this for local use (`npm run docker:up`). By hand:
#   docker build -t discover-spain \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
#     --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... .
#   docker run --rm -p 3000:3000 --add-host host.docker.internal:host-gateway \
#     -e SUPABASE_URL=http://host.docker.internal:54321 discover-spain

FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Dependencies: cached until package.json or package-lock.json change.
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# 2. Build. The build never talks to Supabase: every page is rendered at request time.
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
RUN if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" ]; then \
      echo "Set the NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY build args (see the top of this Dockerfile)." >&2; \
      exit 1; \
    fi
# `public/` is optional in Next.js; create it so the COPY below works either way.
RUN --mount=type=cache,target=/app/.next/cache mkdir -p public && npm run build

# 3. Runtime: just the standalone server, static assets and Node, running as the non-root `node` user.
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
