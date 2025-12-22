# ===============================================
FROM registry.access.redhat.com/ubi9/nodejs-22 AS appbase
# ===============================================

WORKDIR /app

USER root

# Install pnpm
RUN npm install -g pnpm

# Offical image has npm log verbosity as info. More info - https://github.com/nodejs/docker-node#verbosity
ENV NPM_CONFIG_LOGLEVEL=warn

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Global npm deps in a non-root user directory
ENV NPM_CONFIG_PREFIX=/app/.npm-global
ENV PATH=$PATH:/app/.npm-global/bin

# Copy package.json and pnpm-lock.yaml files
COPY package.json pnpm-lock.yaml /app/
RUN chown -R default:root /app

# Use non-root user
USER default

# Install npm depepndencies
ENV PATH=/app/node_modules/.bin:$PATH

RUN pnpm config set network-timeout 300000
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy all necessary files
COPY tsconfig.json .eslintignore .eslintrc .prettierrc .env .env.development .env.test /app/
COPY /public/ /app/public
COPY /scripts/ /app/scripts
COPY /src/ /app/src


# =============================
FROM appbase AS development
# =============================

WORKDIR /app

# Set NODE_ENV to development in the development container
ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

# Bake package.json start command into the image
CMD ["pnpm", "start"]

# ===================================
FROM appbase AS staticbuilder
# ===================================

COPY . /app
RUN pnpm build

# =============================
FROM registry.access.redhat.com/ubi9/nginx-122 AS production
# =============================

USER root

RUN chgrp -R 0 /usr/share/nginx/html && \
    chmod -R g=u /usr/share/nginx/html

# Copy static build
COPY --from=staticbuilder /app/build /usr/share/nginx/html

# Copy nginx config
COPY .prod/nginx.conf  /etc/nginx/nginx.conf


WORKDIR /usr/share/nginx/html

# Copy default environment config and setup script
# Copy package.json so env.sh can read it
COPY ./scripts/env.sh /opt/env.sh
COPY .env /opt/.env
COPY package.json /opt/package.json
RUN chmod +x /opt/env.sh

EXPOSE 8080

CMD ["/bin/bash", "-c", "/opt/env.sh /opt /usr/share/nginx/html && nginx -g \"daemon off;\""]

