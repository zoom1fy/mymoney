FROM node:20

WORKDIR /

COPY package.json package-lock.json ./
RUN npm install           
COPY . .                  
RUN npx prisma generate

CMD ["npm", "run", "start:dev"]

# FROM node:20 AS builder
# WORKDIR /app

# COPY package*.json ./
# RUN npm ci

# COPY . .
# RUN npx prisma generate
# RUN npm run build

# # Production-этап
# FROM node:20-alpine AS production
# WORKDIR /app

# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/prisma ./prisma
# COPY package*.json ./

# ENV NODE_ENV=production
# CMD ["npm", "run", "start:prod"]
