# syntax=docker/dockerfile:1

########## build stage ##########
FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                       # reproducible, incl. dev deps for tsc
COPY tsconfig.json ./
COPY src ./src
RUN npm run build                # -> dist/

########## runtime stage ##########
FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:3000/.well-known/oauth-authorization-server" || exit 1
CMD ["node", "dist/index.js"]
