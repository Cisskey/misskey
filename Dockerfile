FROM node:16.0.0-alpine3.13 AS base

ENV NODE_ENV=production
ARG VERSION_SUFFIX

WORKDIR /misskey

FROM base AS builder

RUN apk add --no-cache \
    autoconf \
    automake \
    file \
    g++ \
    gcc \
    libc-dev \
    libtool \
    make \
    nasm \
    pkgconfig \
    python3 \
    zlib-dev \
    vips-dev \
    vips

COPY package.json yarn.lock .yarnrc ./
RUN yarn install
COPY . ./
RUN sed -i'' -E 's/'$'\t''"version": "(.*)",/'$'\t''"version": "\1'"$VERSION_SUFFIX"'",/' package.json
RUN yarn build

FROM base AS runner

RUN apk add --no-cache \
    ffmpeg \
    tini \
    vips

ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=builder /misskey/node_modules ./node_modules
COPY --from=builder /misskey/built ./built
COPY . ./
RUN sed -i'' -E 's/'$'\t''"version": "(.*)",/'$'\t''"version": "\1'"$VERSION_SUFFIX"'",/' package.json

CMD ["npm", "run", "start"]
