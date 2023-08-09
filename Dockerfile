FROM node:20-alpine
RUN apk add --no-cache git
RUN apk add --no-cache openssl
RUN mkdir /src
COPY . /src
WORKDIR /src
RUN npm install
RUN git clone https://github.com/camicroscope/camicroscope.git --branch=seer/nci-dccps-srp
EXPOSE 8010

RUN chgrp -R 0 /src && \
    chmod -R g+rwX /src

USER 1001

CMD node caracal.js
