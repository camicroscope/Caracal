const tf = require('@tensorflow/tfjs-node');

// enable this and comment previous one for GPU (CUDA) training --
// proper nvidia drivers needs to be installed on both base machine and container for gpu training
// const tf = require('@tensorflow/tfjs-node-gpu');

const fs = require('fs');
const inkjet = require('inkjet');
const crypto = require("crypto");
const AdmZip = require('adm-zip');
const path = require('path');

let LABELS_PATH = null;
let IMAGES_SPRITE_PATH = null;


class Data {
  constructor() {
    this.IMAGE_SIZE = null;
    this.NUM_CLASSES = null;
    this.NUM_TRAIN_ELEMENTS = null;
    this.NUM_TEST_ELEMENTS = null;
    this.IMAGES_SPRITE_PATH = IMAGES_SPRITE_PATH;
    this.NUM_CHANNELS = null; // 1 for grayscale; 4 for rgba
    this.LABELS_PATH = LABELS_PATH;
    this.shuffledTrainIndex = null;
    this.shuffledTestIndex = null;
    this.datasetImages = null;
    this.xs = null;
    this.labels = null;
  }
  async load() {
    let This = this;
    const imgRequest = new Promise((resolve) => {
      // console.log(this.IMAGES_SPRITE_PATH);
      inkjet.decode(fs.readFileSync(this.IMAGES_SPRITE_PATH), function(err, decoded) {
        const pixels = Float32Array.from(decoded.data).map((pixel) => {
          return pixel / 255;
        });
        This.datasetImages = pixels;
        resolve();
      });
    });

    let labelsRequest = fs.readFileSync(this.LABELS_PATH);
    const [imgResponse, labelsResponse] = await Promise.all([
      imgRequest,
      labelsRequest,
    ]);

    this.datasetLabels = new Uint8Array(labelsResponse);

    // Create shuffled indices into the train/test set for when we select a
    // random dataset element for training / validation.
    this.trainIndices = tf.util.createShuffledIndices(this.NUM_TRAIN_ELEMENTS);
    this.testIndices = tf.util.createShuffledIndices(this.NUM_TEST_ELEMENTS);

    // Slice the the images and labels into train and test sets.
    this.trainImages = this.datasetImages.slice(
        0,
        this.IMAGE_SIZE * this.NUM_TRAIN_ELEMENTS * this.NUM_CHANNELS,
    );
    this.testImages = this.datasetImages.slice(
        this.IMAGE_SIZE * this.NUM_TRAIN_ELEMENTS * this.NUM_CHANNELS,
    );
    this.trainLabels = this.datasetLabels.slice(
        0,
        this.NUM_CLASSES * this.NUM_TRAIN_ELEMENTS,
    );
    this.testLabels = this.datasetLabels.slice(
        this.NUM_CLASSES * this.NUM_TRAIN_ELEMENTS,
    );
  }

  nextTrainBatch(batchSize) {
    return this.nextBatch(
        batchSize,
        [this.trainImages, this.trainLabels],
        () => {
          this.shuffledTrainIndex =
          (this.shuffledTrainIndex + 1) % this.trainIndices.length;
          return this.trainIndices[this.shuffledTrainIndex];
        },
    );
  }

  nextTestBatch(batchSize) {
    return this.nextBatch(batchSize, [this.testImages, this.testLabels], () => {
      this.shuffledTestIndex =
        (this.shuffledTestIndex + 1) % this.testIndices.length;
      return this.testIndices[this.shuffledTestIndex];
    });
  }

  nextBatch(batchSize, data, index) {
    const batchImagesArray = new Float32Array(
        batchSize * this.IMAGE_SIZE * this.NUM_CHANNELS,
    );
    const batchLabelsArray = new Uint8Array(batchSize * this.NUM_CLASSES);

    for (let i = 0; i < batchSize; i++) {
      const idx = index();
      const image = data[0].slice(
          idx * this.IMAGE_SIZE * this.NUM_CHANNELS,
          idx * this.IMAGE_SIZE * this.NUM_CHANNELS + this.IMAGE_SIZE * this.NUM_CHANNELS,
      );
      batchImagesArray.set(image, i * this.IMAGE_SIZE * this.NUM_CHANNELS);

      const label = data[1].slice(
          idx * this.NUM_CLASSES,
          idx * this.NUM_CLASSES + this.NUM_CLASSES,
      );
      batchLabelsArray.set(label, i * this.NUM_CLASSES);
    }

    this.xs = tf.tensor3d(batchImagesArray, [
      batchSize,
      this.IMAGE_SIZE,
      this.NUM_CHANNELS,
    ]);
    this.labels = tf.tensor2d(batchLabelsArray, [batchSize, this.NUM_CLASSES]).toFloat();
    return {xs: this.xs, labels: this.labels};
  }
}

function getDataset() {
  return function(req, res) {
    let data = JSON.parse(req.body);
    // console.log(req.body.ar);
    let userFolder = crypto.randomBytes(20).toString('hex');
    if (!fs.existsSync('dataset')) {
      fs.mkdirSync('dataset/');
    }
    fs.mkdirSync('dataset/' + userFolder);
    fs.writeFile('dataset/' + userFolder + '/dataset.zip', data.file,
        {encoding: 'base64'},
        async function(err) {
          let zip = new AdmZip('dataset/' + userFolder + '/dataset.zip');
          await zip.extractAllTo('dataset/' + userFolder, true);
          LABELS_PATH = 'dataset/' + userFolder + '/labels.bin';
          IMAGES_SPRITE_PATH = 'dataset/' + userFolder + '/data.jpg';
          fs.unlink('dataset/' + userFolder + '/dataset.zip', () => {});
          res.json({status: 'DONE', userFolder: userFolder});
        },
    );
  };
}

function deleteData() {
  return function(req, res) {
    let data = JSON.parse(req.body);
    let dir = path.normalize(data.userFolder).replace(/^(\.\.(\/|\\|$))+/, '');
    dir = path.join('./dataset/', dir);
    fs.rmdir(dir, {recursive: true}, (err) => {
      if (err) {
        throw err;
      }
      console.log(`Temp folder deleted!`);
    });
    res.json({status: 'Temp folder deleted!'});
  };
}

module.exports = {Data: Data, getDataset: getDataset, deleteData: deleteData};
