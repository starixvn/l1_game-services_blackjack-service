# Base image
FROM git3.nexdev.net:5050/lumi-ops/docker-images/node:14.15-alpine3

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
RUN mkdir /opt/node_app && chown node:node /opt/node_app
WORKDIR /opt/node_app

USER node

COPY package.json package-lock.json* ./

RUN npm run reg
RUN npm install && npm cache clean --force
ENV PATH /opt/node_app/node_modules/.bin:$PATH

WORKDIR /opt/node_app/app
COPY ./src .

HEALTHCHECK --interval=30s CMD node --es-module-specifier-resolution=node healthcheck.js

CMD [ "node", "--max-old-space-size=8192", "--es-module-specifier-resolution=node", "./app.js" ]