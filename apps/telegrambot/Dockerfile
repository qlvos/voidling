FROM node:18.13.0-bullseye-slim

#Working Dir
WORKDIR /apps/telegram/

COPY package*.json ./

RUN npm install

# Copy Source Files
COPY . .

CMD [ "npm", "run", "start"]




