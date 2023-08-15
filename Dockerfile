FROM camicroscope/caracal:nci-dccps-srp-2
EXPOSE 8010
WORKDIR /src

CMD ["node", "caracal.js"]
