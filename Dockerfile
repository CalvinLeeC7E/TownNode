FROM node:20.17.0-bullseye-slim AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apk add --no-cache libc6-compat gcompat gcc g++ make python3
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi
RUN npm install pm2 -g

# Rebuild the source code only when needed
FROM deps AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# If using npm comment out above and use below instead
RUN npm run build

# Production image, copy all the files and run next
FROM deps AS runner
# pm2 run need it
WORKDIR /app

ENV NODE_ENV production
ENV PORT 80

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./
COPY ./ecosystem.config.js ./
COPY ./package.json ./

EXPOSE 80

CMD ["pm2-runtime", "start", "./ecosystem.config.js"]
