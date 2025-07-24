FROM node:20

WORKDIR /

COPY package.json package-lock.json ./
RUN npm install           
COPY . .                  
RUN npx prisma generate

CMD ["npm", "run", "start:dev"]
