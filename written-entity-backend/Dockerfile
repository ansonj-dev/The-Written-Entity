FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Copy Prisma schema before installing dependencies
COPY prisma ./prisma

# Install dependencies with retry logic
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps || npm install --prefer-offline --no-audit

# Copy application code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && npm run build

EXPOSE 10000

CMD ["npm", "start"]
