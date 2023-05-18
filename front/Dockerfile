FROM node:hydrogen-alpine3.17

# Label creator of Dockerfile
LABEL maintainer="crojas@itba.edu.ar"

# Create a user, group and workdir to avoid using root
RUN groupadd -g 999 node \
    && useradd -r -u 999 -g node node \
    && mkdir -p /usr/app \
    && chown -R node:node /usr/app

# Move to folder and change user
WORKDIR /usr/app
USER 999

# Copy package*.json and install dependencies from lock (To better use docker cache)
COPY --chown=node:node package*.json ./
RUN npm ci

# Copy rest of files and build project
COPY --chown=node:node . .
RUN npm run build

# Expose the port to be used
EXPOSE 3000

# Run the built code
CMD ["npm", "run", "serve"]