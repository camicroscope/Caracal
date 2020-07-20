const tf = require('@tensorflow/tfjs-node');

// enable this and comment previous one for GPU (CUDA) training --
// proper nvidia drivers needs to be installed on both base machine and container for gpu training
// const tf = require('@tensorflow/tfjs-node-gpu');

const fs = require('fs');
const inkjet = require('inkjet');
const crypto = require("crypto");
const AdmZip = require('adm-zip');
const path = require('path');

let LABELS_PATH = '';
let IMAGES_SPRITE_PATH = '';

let datasetImages = [];

class Data {
  constructor() {
    this.IMAGE_SIZE = 0;
    this.NUM_CLASSES = 0;
    this.NUM_TRAIN_ELEMENTS = 0;
    this.NUM_TEST_ELEMENTS = 0;
    this.IMAGES_SPRITE_PATH = IMAGES_SPRITE_PATH;
    this.NUM_CHANNELS = 0; // 1 for grayscale; 4 for rgba
    this.LABELS_PATH = LABELS_PATH;
    this.shuffledTrainIndex = 0;
    this.shuffledTestIndex = 0;
  }
  async load() {
    const imgRequest = new Promise((resolve) => {
      // console.log(this.IMAGES_SPRITE_PATH);
      inkjet.decode(fs.readFileSync(this.IMAGES_SPRITE_PATH), function(err, decoded) {
        const pixels = Float32Array.from(decoded.data).map((pixel) => {
          return pixel / 255;
        });
        datasetImages = pixels;
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
    this.trainImages = datasetImages.slice(
        0,
        this.IMAGE_SIZE * this.NUM_TRAIN_ELEMENTS * this.NUM_CHANNELS,
    );
    this.testImages = datasetImages.slice(
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

    const xs = tf.tensor3d(batchImagesArray, [
      batchSize,
      this.IMAGE_SIZE,
      this.NUM_CHANNELS,
    ]);
    const labels = tf.tensor2d(batchLabelsArray, [batchSize, this.NUM_CLASSES]).toFloat();

    return {xs, labels};
  }
}

function getDataset(req, res) {
  // console.log(req.body.ar);
  let userFolder = crypto.randomBytes(20).toString('hex');
  if (!fs.existsSync('dataset')) {
    fs.mkdirSync('dataset/');
  }
  fs.mkdirSync('dataset/' + userFolder);
  fs.writeFile('dataset/' + userFolder + '/dataset.zip', req.body.file,
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
}

function deleteData(req, res) {
  let dir = path.normalize(req.body.userFolder).replace(/^(\.\.(\/|\\|$))+/, '');
  dir = path.join('./dataset/', dir);
  fs.rmdir(dir, {recursive: true}, (err) => {
    if (err) {
      throw err;
    }
    console.log(`Temp folder deleted!`);
  });
  res.json({status: 'Temp folder deleted!'});
}

module.exports = {Data: Data, getDataset: getDataset, deleteData: deleteData};
