FROM node:hydrogen-alpine3.17

# Label creator of Dockerfile
LABEL maintainer="crojas@itba.edu.ar"

# Node image has user and group node already so we don't have to create it. We just create working dir and change owner
RUN mkdir -p /usr/app \
    && chown -R node:node /usr/app

# Move to folder and change user
WORKDIR /usr/app
USER node

# Copy package*.json and install dependencies from lock (To better use docker cache)
COPY --chown=node:node package*.json ./
RUN npm ci

# Copy rest of files and build project
COPY --chown=node:node . .
RUN npm run build

# Expose the port to be used
EXPOSE 3000

# Run the built code
CMD ["node", "./dist/server.js"]