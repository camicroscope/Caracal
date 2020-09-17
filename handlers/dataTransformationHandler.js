const client = require("mongodb").MongoClient;
const fs = require("fs");

class DataTransformationHandler {
  constructor(url, path) {
    this.url = url;
    this.filePath = path;
    this.handler = null;
    this.counter = 0;
    this.max = 300;
    this.id = 1;
    this.idLength = 6;
    this.isProcessing = false;
  }

  startHandler() {
    console.log("||-- Start --||");
    this.counter = 0;
    this.max = 300;
    this.id = 1;
    this.handler = setInterval(this.connect.bind(this), 10000);
  }

  loadDefaultData() {
    let rawdata;
    let config;
    try {
      rawdata = fs.readFileSync(this.filePath);
      config = JSON.parse(rawdata);
    } catch (err) {
      if (err.code == "ENOENT") {
        console.log(`'${this.filePath}' File Fot Found!`);
      } else {
        throw err;
      }
    }
    return config;
  }

  connect() {
    if (this.isProcessing) {
      return;
    }
    if (this.counter++ == this.max) {
      this.cleanHandler();
      return;
    }
    this.isProcessing = true;
    const query = {config_name: "preset_label"};
    client
        .connect(this.url, {useNewUrlParser: true})
        .then((dbc) => {
          const collection = dbc.db("camic").collection("configuration");
          collection.find(query).toArray((err, rs) => {
            if (err) {
              this.isProcessing = false;
              console.log(`||-- The 'Preset Labels' Document Upgrade Is Failed --||`);
              console.log(err);
              dbc.close();
              this.cleanHandler();
              return;
            }
            // add default data
            if (rs.length < 1) {
              // read default data from json
              const defaultData = this.loadDefaultData();
              // insert default data
              collection.insertOne(defaultData, (err, result) => {
                if (err) {
                  this.isProcessing = false;
                  console.log(`||-- The 'Preset Labels' Document Upgrade Is Failed --||`);
                  console.log(err);
                  dbc.close();
                  this.cleanHandler();
                  return;
                }
                dbc.close();
                // clear handler
                this.cleanHandler();
              });
              return;
            }

            if (rs.length > 0 && rs[0].version != "1.0.0") {
              const config = rs[0];
              const list = [];
              if (config.configuration && Array.isArray(config.configuration)) {
                config.configuration.forEach((node) => {
                  this.extractNode(node, list);
                });
              }
              config.configuration = list;
              config.version = '1.0.0';
              if (!(list && list.length)) return;
              collection.deleteOne(query, (err, result) => {
                if (err) {
                  this.isProcessing = false;
                  console.log(`||-- The 'Preset Labels' Document Upgrade Is Failed --||`);
                  console.log(err);
                  dbc.close();
                  this.cleanHandler();
                  return;
                }
                collection.insertOne(config, (err, result) => {
                  if (err) {
                    this.isProcessing = false;
                    console.log(`||-- The 'Preset Labels' Document Upgrade Is Failed --||`);
                    console.log(err);
                    dbc.close();
                    this.cleanHandler();
                    return;
                  }
                  this.isProcessing = false;
                  console.log(`||-- The Document At The 'configuration' Collection Has Been Upgraded To Version 1.0.0 --||`);
                  dbc.close();
                  this.cleanHandler();
                });
              });
            }
          });
        }).catch((err) => {
          console.log(`||-- The 'Preset Labels' Document Upgrade Is Failed --||`);
          console.log(err.message);
          this.isProcessing = false;
          if (this.max == this.counter) {
            this.cleanHandler();
          }
        });
  }
  extractNode(node, list) {
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((n) => {
        this.extractNode(n, list);
      });
    }
    if (
      node.data &&
      (typeof node.data === "object" || typeof node.data === "function") &&
      node.data !== null
    ) {
      const id = zeroFill(this.id++, this.idLength);
      list.push({id, ...node.data});
    }
  }

  cleanHandler() {
    console.log("||-- Done --||");
    this.counter = 0;
    this.max = 300;
    this.id = 1;
    this.isProcessing = false;
    clearInterval(this.handler);
  }
}

function zeroFill(number, width) {
  width -= number.toString().length;
  if (width > 0) {
    return new Array(width + (/\./.test(number) ? 2 : 1)).join("0") + number;
  }
  return number + "";
}

module.exports = DataTransformationHandler;
