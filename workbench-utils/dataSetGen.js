const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const AdmZip = require('adm-zip');
const crypto = require('crypto');
const del = require('del');
// var zip1 = require('cross-zip');
// const {isIP} = require('net');
// const {PythonShell} = require('python-shell');

let Promises = [];
let zipCount = 0;
let PromiseCount = 0;

let getMultipleZips = async function(req, res) {
  // res.send(req);
  console.log('hi');
  Promises = [];
  let fileNames = [];
  PromiseCount = 0;
  try {
    if (!req.files) {
      res.send({
        status: false,
        message: 'No file uploaded',
      });
    } else {
      let data = [];
      // console.log('hi1');
      zipCount = req.files.zips.length;
      // loop all files
      _.forEach(_.keysIn(req.files.zips), async (key) => {
        console.log('started');
        let zip = req.files.zips[key];
        fileNames.push(zip.name);

        // move zip to uploads directory
        zip
            .mv('./uploads/' + zip.name)
            .then(async function() {
              new Promise(async function(resolve, reject) {
                await unzipUploads(fileNames);
                resolve('Extracted');
              })
                  .then(async (resolve) => {
                    console.log(resolve);
                    let location = './uploads/' + zip.name;
                    console.log(location);
                    // deleteFile(location);
                    await readCSV(location.slice(0, -4), res);
                  })
                  .catch((error) => {
                    console.log(error);
                  });
            })
            .catch((error) => {
              console.log(error);
            });
        // push file details
        data.push({
          name: zip.name,
          mimetype: zip.mimetype,
          size: zip.size,
        });
      });
      // deleteFolderRecursive('./uploads');
      // return response
      // res.send({
      //   status: true,
      //   message: 'Files are uploaded',
      //   data: data,
      // });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
};

let getZip = async function(req, res) {
  Promises = [];
  let fileNames = [];
  PromiseCount = 0;
  zipCount = 1;
  try {
    if (!req.files) {
      res.send({
        status: false,
        message: 'No file uploaded',
      });
    } else {
      let zip = req.files.zips;
      fileNames.push(zip.name);
      zip
          .mv('./uploads/' + zip.name)
          .then(function() {
            new Promise(function(resolve, reject) {
              unzipUploads(fileNames);
              resolve('Extracted');
            })
                .then((resolve) => {
                  console.log(resolve);
                  readCSV('./uploads/' + fileNames[0].slice(0, -4), res);
                })
                .catch((error) => {
                  console.log(error);
                });
          })
          .catch((error) => {
            console.log(error);
          });

      // send response
      // res.send({
      //   status: true,
      //   message: 'File is uploaded',
      //   data: {
      //     name: zip.name,
      //     mimetype: zip.mimetype,
      //     size: zip.size,
      //   },
      // });
    }
  } catch (err) {
    res.status(500).send(err);
  }
};

let deleteDataset = async function(req, res) {
  fs.access('./workbench-utils/dataset', function(error) {
    if (error) {
      fs.access('./workbench-utils/dataset.zip', function(error) {
        if (error) {
          console.log(error);
          res.send({
            status: 'not present',
          });
        } else {
          deleteFolder(['./workbench-utils/dataset.zip'], res);
        }
      });
    } else {
      fs.access('./workbench-utils/dataset.zip', function(error) {
        if (error) {
          deleteFolder(['./workbench-utils/dataset'], res);
        } else {
          deleteFolder(
              ['./workbench-utils/dataset', './workbench-utils/dataset.zip'],
              res,
          );
        }
      });
    }
  });
};

let deleteUnselectedLabels = async function(req, res) {
  fs.access('./workbench-utils/dataset', function(error) {
    if (error) {
      console.log('Directory does not exist.');
      res.send({
        status: 'didnt exist',
      });
    } else {
      let toBeDeleted = [];
      for (i = 0; i < req.body.labels.length; i++) {
        if (req.body.included[i] == 'false') {
          toBeDeleted.push('./workbench-utils/dataset/' + req.body.labels[i]);
        }
      }
      console.log(toBeDeleted);
      deleteFolder(toBeDeleted, res);
    }
  });
};

let generateSpritesheet = async function(req, res) {
  makeSpritesheet(req.body.labels, res);
};

async function createDatasetZip(res) {
  let zip = new AdmZip();
  zip.addLocalFile('./workbench-utils/dataset/labels.bin');
  zip.addLocalFile('./workbench-utils/dataset/data.jpg');
  // zip.addLocalFolder('./workbench-utils/dataset');
  await zip.writeZip('./workbench-utils/dataset.zip');
  // var inPath = path.join(__dirname, 'workbench-utils/dataset'); // folder to zip
  // var outPath = path.join(__dirname, 'myFile.zip');
  // zip1.zipSync(inPath, outPath);
  deleteFolder(['./workbench-utils/dataset']);
  res.send({
    status: 'done',
    message: 'sprite zip ready',
  });
}

function deleteFolder(path, res = 0) {
  (async () => {
    const deletedPaths = await del(path);
    console.log('Deleted files and directories:\n', deletedPaths.join('\n'));
    if (res != 0) {
      res.send({
        status: 'deleted',
        paths: deletedPaths.join('\n'),
      });
    }
  })();
}

function makeSpritesheet(files, res) {
  let python = ['./workbench-utils/spritemaker.py'];
  for (i = 0; i < files.length; i++) python.push(files[i]);
  console.log(python);
  var spawn = require('child_process').spawn;
  var process = spawn('python3', python);
  process.stdout.on('data', function(data) {
    console.log(data.toString());

    createDatasetZip(res);
  });
  // PythonShell.run('./workbench-utils/spritemaker.py', null, function(err, results) {
  //   if (err) throw err;
  //   console.log('finished');
  //   console.log('results: %j', results);
  // });
}

// Check if all the zip files are processed and dataset folder has been organized
function checkCompletion(res) {
  // console.log(Promises.length);
  Promise.all(Promises).then(function() {
    // console.log('end');
    let filesCountPromise = [];
    let perLabelsCount = [];
    PromiseCount++;
    if (PromiseCount == zipCount) {
      console.log('END');
      deleteFolder(['./uploads']);
      fs.readdir('./workbench-utils/dataset', (err, files) => {
        for (i = 0; i <= files.length; i++) {
          if (i != files.length) {
            filesCountPromise.push(
                new Promise(function(resolve, reject) {
                  fs.readdir(
                      './workbench-utils/dataset/' + files[i],
                      (err, files) => {
                        perLabelsCount.push(files.length);
                        resolve('counted');
                      },
                  );
                }),
            );
          } else {
            Promise.all(filesCountPromise).then(function() {
              console.log(perLabelsCount);
              res.send({
                status: 'DONE',
                labels: files,
                counts: perLabelsCount,
              });
            });
          }
        }
      });
    }
  });
}

function organizeDataFolder(location, CSVrows, res) {
  let dir = './workbench-utils/dataset';
  let dir1 = './workbench-utils/dataset1';

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    fs.mkdirSync(dir1);
  }
  for (i = 0; i <= CSVrows.length; i++) {
    if (i != CSVrows.length) {
      if (CSVrows[i].note != '') {
        let dir = './workbench-utils/dataset/' + CSVrows[i].note;
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
        let fileName = crypto.randomBytes(20).toString('hex') + '.jpg';
        let oldPath =
          location + CSVrows[i].location.slice(1, CSVrows[i].location.length);
        let newPath = dir + '/' + fileName;
        Promises.push(
            new Promise(function(resolve, reject) {
              fs.rename(oldPath, newPath, function(err) {
                if (err) throw err;
                console.log('Successfully renamed - AKA moved!: ' + oldPath);
                resolve('moved: ' + oldPath);
              });
            }),
        );
      }
    } else {
      checkCompletion(res);
    }
  }
}

function readCSV(location, res) {
  let CSVrows = [];
  fs.createReadStream(location + '/patches.csv')
      .pipe(csv())
      .on('data', (row) => {
        CSVrows.push(row);
      })
      .on('end', () => {
      // console.log(CSVrows);
        console.log('CSV file successfully processed');
        organizeDataFolder(location, CSVrows, res);
      // deleteFile(location + '.zip');
      });
}

function unzipUploads(fileNames) {
  let zip;
  for (i = 0; i < fileNames.length; i++) {
    zip = new AdmZip('./uploads/' + fileNames[i]);
    zip.extractAllTo(
        './uploads/' + fileNames[i].slice(0, -4),
        /* overwrite*/ true,
    );
  }
}

dataGen = {};
dataGen.getMultipleZips = getMultipleZips;
dataGen.getZip = getZip;
dataGen.deleteDataset = deleteDataset;
dataGen.deleteUnselectedLabels = deleteUnselectedLabels;
dataGen.generateSpritesheet = generateSpritesheet;
module.exports = dataGen;
