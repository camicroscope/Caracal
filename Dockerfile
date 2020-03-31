FROM node:12-alpine
RUN mkdir /root/src
RUN apk add git
COPY . /root/src
WORKDIR /root/src
RUN npm install
RUN npm install -g nodemon
ARG viewer
RUN if [ -z ${viewer} ]; then git clone https://github.com/camicroscope/camicroscope.git; else git clone https://github.com/camicroscope/camicroscope.git --branch=$viewer; fi
EXPOSE 8010
CMD nodemon caracal.js
