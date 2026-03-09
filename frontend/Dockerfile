FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

# dev mode so NEXT_PUBLIC_* vars are picked up from the container environment at runtime
CMD ["npm", "run", "dev"]
