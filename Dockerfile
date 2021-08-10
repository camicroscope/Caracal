FROM node:16-stretch-slim
RUN apt-get update  &&  apt-get upgrade -y  &&  apt-get install -y git build-essential python3
RUN mkdir /src
COPY . /src
WORKDIR /src
RUN npm install
ARG DISABLE_TF
RUN if [[ -z $DISABLE_TF ]] ; then npm install tfjs; else echo "Disabled TF"; fi
ARG viewer
ARG fork
RUN git clone https://github.com/${fork:-camicroscope}/camicroscope.git --branch=${viewer:-master}
EXPOSE 8010

RUN chgrp -R 0 /src && \
    chmod -R g+rwX /src

USER 1001

CMD node caracal.js
