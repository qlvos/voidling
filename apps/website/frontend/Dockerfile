FROM node:18.13.0-bullseye-slim AS build

#Working Dir
WORKDIR /

COPY package*.json ./

RUN npm install

# Copy Source Files
COPY . .

RUN npm run grunt

#Expose the API port
EXPOSE 3000

FROM nginx:latest
RUN rm /etc/nginx/conf.d/default.conf
COPY ./template/nginx.conf.template /etc/nginx/templates/nginx.conf.template

RUN rm -rf /usr/share/nginx/html/*

EXPOSE 80



