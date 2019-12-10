FROM node:8-alpine
RUN mkdir /root/src
RUN apk add git

RUN git clone https://github.com/camicroscope/camicroscope

COPY . /root/src
WORKDIR /root/src


RUN npm install
RUN npm install -g forever
EXPOSE 8010
CMD forever index.js
