const tf = require('@tensorflow/tfjs-node');

// enable this and comment previous one for GPU (CUDA) training --
// proper nvidia drivers needs to be installed on both base machine and container for gpu training
// const tf = require('@tensorflow/tfjs-node-gpu');

const Data = require('./datasetHandler.js');
const AdmZip = require('adm-zip');

let Layers = [];
let Params = {};

function getModel(Layers, Params, res) {
  // console.log(Params)
  let model;
  try {
    model = tf.sequential({
      layers: Layers,
    });

    if (Params.advancedMode) {
      model.compile({
        optimizer: Params.optimizer,
        loss: Params.modelCompileLoss,
        metrics: Params.modelCompileMetrics,
      });
    } else {
      model.compile({
        optimizer: Params.optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
      });
    }
  } catch (error) {
    res.status(400).json({message: error.message});
    // res.send(error);
  }

  return model;
}

async function train(model, data, Params) {
  let TRAIN_DATA_SIZE = Params.trainDataSize;
  let TEST_DATA_SIZE = Params.testDataSize;
  let WIDTH = Params.width;
  let HEIGHT = Params.height;

  const [trainXs, trainYs] = tf.tidy(() => {
    const d = data.nextTrainBatch(TRAIN_DATA_SIZE);
    return [
      d.xs.reshape([TRAIN_DATA_SIZE, HEIGHT, WIDTH, data.NUM_CHANNELS]),
      d.labels,
    ];
  });

  const [testXs, testYs] = tf.tidy(() => {
    const d = data.nextTestBatch(TEST_DATA_SIZE);
    return [
      d.xs.reshape([TEST_DATA_SIZE, HEIGHT, WIDTH, data.NUM_CHANNELS]),
      d.labels,
    ];
  });

  return model.fit(trainXs, trainYs, {
    batchSize: Number(Params.batchSize),
    validationData: [testXs, testYs],
    epochs: Number(Params.epochs),
    shuffle: Params.shuffle,
    // callbacks: console.log(1),
  });
}

async function run(Layers, Params, res, userFolder) {
  try {
    const data = new Data.Data();
    data.IMAGE_SIZE = Params.height * Params.width;
    data.NUM_CLASSES = Params.numClasses;
    data.NUM_CHANNELS = Params.numChannels;
    data.NUM_TEST_ELEMENTS = Params.testDataSize;
    data.NUM_TRAIN_ELEMENTS = Params.trainDataSize;
    // console.log(data);
    try {
      await data.load();
      let model = getModel(Layers, Params, res);
      model.summary();
      await train(model, data, Params);
      console.log('TRAINING DONE');
      await model.save('file://./dataset/' + userFolder + '/');

      let zip = new AdmZip();
      zip.addLocalFile("./dataset/" + userFolder + '/model.json');
      zip.addLocalFile("./dataset/" + userFolder + '/weights.bin');
      zip.writeZip("./dataset/" + userFolder + '/' + Params.modelName +'.zip');

      res.json({status: 'done'});
    } catch (error) {
      console.log(error);
      res.status(400).json({message: error.message});
      // res.send(error);
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({message: error.message});
    // res.send(error);
  }
}

function makeLayers(layers, res, userFolder) {
  delete layers[0].layer;
  delete layers[layers.length - 1].layer;
  Layers = [
    tf.layers.conv2d(layers[0]),
    tf.layers.dense(layers[layers.length - 1]),
  ];
  try {
    for (let i = 1; i < layers.length - 1; i++) {
      if (layers[i].layer == 'dense') {
        delete layers[i].layer;
        Layers.splice(Layers.length - 1, 0, tf.layers.dense(layers[i]));
      } else if (layers[i].layer == 'conv2d') {
        delete layers[i].layer;
        Layers.splice(Layers.length - 1, 0, tf.layers.conv2d(layers[i]));
      } else if (layers[i].layer == 'flatten') {
        delete layers[i].layer;
        Layers.splice(Layers.length - 1, 0, tf.layers.flatten(layers[i]));
      } else if (layers[i].layer == 'batchNormalization') {
        delete layers[i].layer;
        Layers.splice(Layers.length - 1, 0, tf.layers.batchNormalization(layers[i]));
      } else if (layers[i].layer == 'dropout') {
        delete layers[i].layer;
        Layers.splice(Layers.length - 1, 0, tf.layers.dropout(layers[i]));
      } else if (layers[i].layer == 'maxpooling2d') {
        delete layers[i].layer;
        Layers.splice(Layers.length - 1, 0, tf.layers.maxPooling2d(layers[i]));
      } else if (layers[i].layer == 'activation') {
        delete layers[i].layer;
        Layers.splice(Layers.length - 1, 0, tf.layers.activation(layers[i]));
      } else if (layers[i].layer == 'conv2dTranspose') {
        delete layers[i].layer;
        Layers.splice(Layers.length - 1, 0, tf.layers.conv2dTranspose(layers[i]));
      } else if (layers[i].layer == 'averagePooling2d') {
        delete layers[i].layer;
        Layers.splice(Layers.length - 1, 0, tf.layers.averagePooling2d(layers[i]));
      } else if (layers[i].layer == 'globalAveragePooling2d') {
        delete layers[i].layer;
        Layers.splice(Layers.length - 1, 0, tf.layers.globalAveragePooling2d(layers[i]));
      } else if (layers[i].layer == 'globalMaxPooling2d') {
        delete layers[i].layer;
        Layers.splice(Layers.length - 1, 0, tf.layers.globalMaxPooling2d(layers[i]));
      }
      // console.log(layers[i]);
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({message: error.message});
    return;
  }

  run(Layers, Params, res, userFolder);
}

function trainModel(req, res) {
  Params = req.body.Params;
  makeLayers(req.body.Layers, res, req.body.userFolder);
}

module.exports = {trainModel: trainModel};
