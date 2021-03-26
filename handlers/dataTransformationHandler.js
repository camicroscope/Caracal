const fs = require("fs");
const mongoDB = require("../service/database");

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

  async connect() {
    if (this.isProcessing) {
      return;
    }
    if (this.counter++ == this.max) {
      this.cleanHandler();
      return;
    }

    this.isProcessing = true;
    const query = {config_name: "preset_label"};
    try {
      /** fetch saved configurations */
      const rs = await mongoDB.find("camic", "configuration", query, false);

      /** read default data and write to database */
      if (rs.length < 1) {
        const defaultData = this.loadDefaultData();
        await mongoDB.add("camic", "configuration", defaultData);
      }

      /** if not default configuration */
      if (rs.length > 0 && rs[0].version != "1.0.0") {
        const config = rs[0];
        const list = [];
        if (config.configuration && Array.isArray(config.configuration)) {
          config.configuration.forEach((node) => {
            this.extractNode(node, list);
          });
        }

        config.configuration = list;
        config.version = "1.0.0";
        if (!(list && list.length)) {
          return;
        }

        /** delete old stored object and insert new one */
        await mongoDB.delete("camic", "configuration", query);
        await mongoDB.add("camic", "configuration", config);
        this.isProcessing = false;
        this.cleanHandler();
      }
    } catch (err) {
      console.log(`||-- The 'Preset Labels' Document Upgrade Is Failed --||`);
      console.log(err);
      this.cleanHandler();
    }
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
