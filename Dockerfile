FROM node:12-alpine
RUN apk add git
RUN mkdir /root/src
RUN npm install -g nodemon
COPY . /root/src
WORKDIR /root/src
RUN npm install
ARG viewer
RUN if [ -z ${viewer} ]; then git clone https://github.com/camicroscope/camicroscope.git; else git clone https://github.com/camicroscope/camicroscope.git --branch=$viewer; fi
EXPOSE 8010
CMD nodemon caracal.js
