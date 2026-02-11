# Use Node Alpine image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate
# Copy app source
COPY . .

# Build the app
RUN npm run build

# Expose the port your app runs on
EXPOSE 3000

# Command to run the app
CMD ["npm", "run", "start:prod"]
