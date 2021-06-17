FROM node:16-stretch-slim
RUN apt-get update  &&  apt-get upgrade -y  &&  apt-get install -y git build-essential python3
RUN mkdir /src
COPY . /src
WORKDIR /src
RUN npm install
ARG viewer
ARG fork
# RUN git clone https://github.com/${fork:-camicroscope}/camicroscope.git --branch=${viewer:-master}
EXPOSE 8010
EXPOSE 4050
EXPOSE 5000

RUN ls

# RUN chgrp -R 0 /src && \
#     chmod -R g+rwX /src

USER 1001

CMD node caracal.js