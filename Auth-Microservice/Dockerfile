FROM node:22-alpine
WORKDIR /usr/src/app
COPY . ./
RUN npm install
EXPOSE 5002
CMD ["node", "index.js"]