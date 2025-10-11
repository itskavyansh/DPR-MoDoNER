FROM node:18-alpine

# Install Python and build dependencies for native modules
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/ai-services/package*.json ./packages/ai-services/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/ai-services ./packages/ai-services
COPY packages/shared ./packages/shared
COPY tsconfig.json ./
COPY .eslintrc.json ./
COPY .prettierrc ./

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Build ai-services
WORKDIR /app/packages/ai-services
RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]