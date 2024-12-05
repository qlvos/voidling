FROM node:18.13.0-bullseye-slim AS build

#Working Dir
WORKDIR /

COPY package*.json ./

RUN npm install

# Copy Source Files
COPY . .

RUN npm run uglify

#Expose the API port
EXPOSE 3000

FROM nginx:latest
RUN rm /etc/nginx/conf.d/default.conf
COPY ./template/nginx.conf.template.dev /etc/nginx/templates/nginx.conf.template
COPY ./public /usr/share/nginx/html

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build ./public /usr/share/nginx/html
COPY --from=build ./src/*.wasm /usr/share/nginx/html
COPY --from=build ./src/index.html /usr/share/nginx/html

EXPOSE 80



