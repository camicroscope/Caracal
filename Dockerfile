FROM node:25-alpine
RUN apk add --no-cache git
RUN apk add --no-cache openssl
RUN mkdir /src
COPY . /src
WORKDIR /src
RUN npm install
ARG viewer
ARG fork
EXPOSE 4010

CMD node caracal.js
