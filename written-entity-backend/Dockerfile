FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy .npmrc if exists
COPY .npmrc* ./

# Copy Prisma schema first (needed for postinstall)
COPY prisma ./prisma/

# Install dependencies (use npm install to avoid ci issues)
RUN npm install --prefer-offline --no-audit --legacy-peer-deps

# Copy rest of application code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

EXPOSE 10000

CMD ["npm", "start"]
