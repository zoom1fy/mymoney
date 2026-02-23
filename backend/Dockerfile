FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN apk add --no-cache netcat-openbsd

RUN npm install
RUN npx prisma generate

COPY . .

CMD ["sh", "-c", "until nc -z db 3306; do echo 'Waiting for DB...'; sleep 1; done; npm run docker:start:dev"]