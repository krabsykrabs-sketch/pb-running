FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npx prisma db push
RUN npm run seed
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
