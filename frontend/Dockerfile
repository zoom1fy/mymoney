FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# # Этап сборки
# FROM node:18 AS builder
# WORKDIR /app

# COPY package*.json ./
# RUN npm ci

# COPY . .
# RUN npm run build

# # Production-этап
# FROM node:18-alpine AS production
# WORKDIR /app

# ENV NODE_ENV=production

# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/package*.json ./

# EXPOSE 3000
# CMD ["npm", "run", "start"]
