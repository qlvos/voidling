FROM node:18.13.0-bullseye-slim

#Working Dir
WORKDIR /voidling/apps/website/backend

COPY package*.json ./

RUN npm install

COPY . .

#Expose the API port
EXPOSE 47901

CMD [ "npm", "run", "start"]





