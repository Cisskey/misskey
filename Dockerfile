FROM node:14.15.1-alpine AS base

ENV NODE_ENV=production
ARG VERSION_SUFFIX

WORKDIR /misskey

FROM base AS builder

RUN apk add --no-cache \
    autoconf \
    automake \
    file \
		git \
    g++ \
    gcc \
    libc-dev \
    libtool \
    make \
    nasm \
    pkgconfig \
    python \
    zlib-dev

COPY package.json yarn.lock ./
RUN yarn install
COPY . ./
RUN sed -i'' -E 's/'$'\t''"version": "(.*)",/'$'\t''"version": "\1'"$VERSION_SUFFIX"'",/' package.json
RUN yarn build

FROM base AS runner

RUN apk add --no-cache \
    ffmpeg \
    tini
RUN npm i -g web-push
ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=builder /misskey/node_modules ./node_modules
COPY --from=builder /misskey/built ./built
COPY . ./
RUN sed -i'' -E 's/'$'\t''"version": "(.*)",/'$'\t''"version": "\1'"$VERSION_SUFFIX"'",/' package.json

CMD ["npm", "run", "start"]
