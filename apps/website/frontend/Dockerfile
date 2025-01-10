FROM node:18.13.0-bullseye-slim AS build

#Working Dir
WORKDIR /

COPY package*.json ./

RUN npm install

# Copy Source Files
COPY . .

RUN npm run grunt

FROM nginx:latest
RUN rm /etc/nginx/conf.d/default.conf
COPY ./template/nginx.conf.template /etc/nginx/templates/nginx.conf.template

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build ./build /usr/share/nginx/html
COPY --from=build ./src/imports.js /usr/share/nginx/html/imports.js
COPY --from=build ./src/prophecies.js /usr/share/nginx/html
COPY --from=build ./src/canvashelper.js /usr/share/nginx/html
COPY --from=build ./src/nomineespage.js /usr/share/nginx/html
COPY --from=build ./src/indexpage.js /usr/share/nginx/html
COPY --from=build ./src/indexchart.js /usr/share/nginx/html
COPY --from=build ./src/plothelpers.js /usr/share/nginx/html
COPY --from=build ./src/fonts/ProtoMono-Light.otf /usr/share/nginx/html/fonts/
COPY --from=build ./src/index.html /usr/share/nginx/html
COPY --from=build ./src/favicon.png /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

