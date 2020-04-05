FROM node:12-alpine
RUN apk add git
RUN mkdir /root/src
RUN npm install -g forever
COPY . /root/src
WORKDIR /root/src
RUN npm install
ARG viewer
EXPOSE 8010
CMD forever caracal.js
