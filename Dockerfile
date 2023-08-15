FROM camicroscope/caracal:nci-dccps-srp
EXPOSE 8010
WORKDIR /src

CMD ["node", "caracal.js"]
