FROM node:20
RUN apt-get install -y git
RUN mkdir /src
COPY . /src
WORKDIR /src
RUN npm install
RUN git clone https://github.com/camicroscope/camicroscope.git --branch=seer/nci-dccps-srp
EXPOSE 8010

CMD node caracal.js
