FROM node:12-alpine

RUN apk add git
RUN mkdir /root/src
COPY . /root/src
WORKDIR /root/src
RUN npm install
ARG viewer="v3.7.7"
ARG fork
RUN git clone https://github.com/${fork:-camicroscope}/camicroscope.git --branch=${viewer:-master}
EXPOSE 8010

RUN chgrp -R 0 /root && \
    chmod -R g+rwX /root

USER 1001

CMD node caracal.js
