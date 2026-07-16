FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Next.js application
ARG NEXT_INTERNAL_BACKEND_URL
ENV NEXT_INTERNAL_BACKEND_URL=$NEXT_INTERNAL_BACKEND_URL
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
