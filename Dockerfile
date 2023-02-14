FROM node:latest
RUN mkdir /src
COPY . /src
WORKDIR /src
RUN npm install
ARG viewer
ARG fork
RUN apt-get update
RUN apt-get install git -q -y
RUN apt-get install sendmail -q -y
RUN git clone https://github.com/${fork:-camicroscope}/camicroscope.git --branch=${viewer:-master}
EXPOSE 4010

CMD node caracal.js
