FROM node:20-alpine
RUN apk add --no-cache git
RUN apk add --no-cache openssl
RUN mkdir /src
COPY . /src
WORKDIR /src
RUN npm install
ARG viewer
ARG fork
RUN git clone https://github.com/${fork:-camicroscope}/camicroscope.git --branch=${viewer:-master}
EXPOSE 8010

RUN chgrp -R 0 /src && \
    chmod -R g+rwX /src

USER 1001

CMD node caracal.js
