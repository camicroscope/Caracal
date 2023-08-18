FROM --platform=linux/amd64 camicroscope/caracal:nci-dccps-srp-4
EXPOSE 8010
WORKDIR /src

CMD ["node", "caracal.js"]
