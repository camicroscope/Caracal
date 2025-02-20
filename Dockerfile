FROM node:20-alpine
RUN apk add --no-cache git
RUN apk add --no-cache openssl
RUN apk add bash
RUN mkdir /src
COPY . /src
WORKDIR /src
RUN npm install
ARG viewer
ARG fork
RUN git clone https://github.com/${fork:-camicroscope}/camicroscope.git --branch=${viewer:-master} --depth 1
EXPOSE 4010

CMD node caracal.js
