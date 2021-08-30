FROM node:alpine as builder

ENV REACT_APP_RUNTIME=Production

WORKDIR '/home/videos'

COPY . .
RUN npm install --production
RUN npm run build

FROM nginx
EXPOSE 3001
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /home/videos/build /usr/share/nginx/html
