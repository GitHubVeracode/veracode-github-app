FROM node:18-slim
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
EXPOSE 3000
RUN npm ci --development
RUN npm cache clean --force
ENV NODE_ENV="development"
COPY . .
CMD [ "npm", "start" ]
