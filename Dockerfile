FROM node:14-stretch-slim
RUN apt-get update  &&  apt-get upgrade -y  &&  apt-get install -y git
RUN mkdir /root/src
COPY . /root/src
WORKDIR /root/src
RUN npm install
ARG viewer
ARG fork
RUN git clone https://github.com/${fork:-camicroscope}/camicroscope.git --branch=${viewer:-master}
EXPOSE 8010
CMD node caracal.js
