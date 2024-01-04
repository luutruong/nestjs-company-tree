ARG BASE_IMAGE=node:18.19.0-alpine

FROM ${BASE_IMAGE} as deps

WORKDIR /app

COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile

FROM ${BASE_IMAGE} as builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM ${BASE_IMAGE} as runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

COPY ./src ./src
COPY ./test ./test
COPY nest-cli.json .
COPY package.json .
COPY tsconfig.build.json .
COPY tsconfig.json .
COPY yarn.lock .

EXPOSE 3000

CMD ["yarn", "start:dev"]