FROM node:18.13.0-bullseye-slim

#Working Dir
WORKDIR /rgsite/backend/

COPY package*.json ./

RUN npm install

# Copy Source Files
COPY . .

#Expose the API port
EXPOSE 47900

CMD [ "npm", "run", "start"]





