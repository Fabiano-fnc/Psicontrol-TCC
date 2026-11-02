FROM node:18.19.1-slim as build 

WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
ENV REACT_APP_API_URL=https://psicontrol-back.fly.dev
RUN npm run build

FROM nginx:1.19
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/build /usr/share/nginx/html
