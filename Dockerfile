# ============================================================
# STAGE 1: Build the application
# ============================================================
FROM helsinki.azurecr.io/ubi9/nodejs-24-pnpm-builder-base AS appbase

WORKDIR /app

COPY --chown=default:root package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=default:root ./scripts ./scripts
COPY --chown=default:root ./public ./public
RUN pnpm install --frozen-lockfile --ignore-scripts && pnpm store prune
RUN pnpm update-runtime-env

COPY --chown=default:root index.html vite.config.ts tsconfig.json eslint.config.mjs .prettierrc .env* ./
COPY --chown=default:root ./src ./src


# ============================================================
# STAGE 2: Development
# ============================================================
FROM appbase AS development

WORKDIR /app
ENV NODE_ENV=development
EXPOSE 3000
CMD pnpm start


# ============================================================
# STAGE 3: Static builder
# ============================================================
FROM appbase AS staticbuilder

RUN pnpm build


# ============================================================
# STAGE 4: Production runtime
# ============================================================
FROM helsinki.azurecr.io/ubi10/nginx-126-spa-standard AS production

# Copy static build
COPY --from=staticbuilder /app/dist /usr/share/nginx/html

# Setup runtime environment injection using env.sh from the base image
WORKDIR /usr/share/nginx/html
COPY .env .
COPY package.json .
