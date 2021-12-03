const {MongoClient, ObjectID} = require("mongodb");

function randomId() {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return `_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
}
//
class FixAnnotationLabelIDPatch {
  /**
   * @constructor to initialize connection to database server
   */
  constructor(mongoUrl="mongodb://ca-mongo", db="camic", recordPerBatch=20000) {
    /** connection specifics */
    this.mongoUrl = mongoUrl;
    this.db = db;
    this.labelMap = new Map();
    /** connection configurations */
    const configs = {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    };
    this.client = new MongoClient(this.mongoUrl, configs);

    // deal batch
    this.totalBatch;
    this.totalRecord;
    this.currentBatch = 1;
    this.recordPerBatch = recordPerBatch;
  }
  async run() {
    console.log('FixAnnotationLabelIDPatch Start');

    console.log(`waiting to connect ${this.mongoUrl}/${this.db}`);
    await this.client.connect();
    console.log(`[database:${this.db}] connected`);
    // get connector
    const connector = this.client.db(this.db);

    // config_prelabel
    const configCollection = connector.collection('configuration');
    const query = {'config_name': 'preset_label'};
    const opt = {};
    const configData = await configCollection.findOne(query, opt);

    // clear the label map
    this.labelMap.clear();
    configData.configuration.forEach((label)=>{
      this.labelMap.set(label.type, label);
    });

    // preset label annotation without labelId
    // provenance.analysis.labelId
    // properties.annotations.labelId
    const markCollection = connector.collection('mark');
    this.totalRecord = await markCollection.countDocuments({
      'provenance.analysis.source': 'human',
      'provenance.analysis.type': 'label',
      'provenance.analysis.labelId': {$exists: false},
    });

    // get total batch
    this.totalBatch = Math.ceil(this.totalRecord/this.recordPerBatch);


    console.log(`TOTAL Annotations Batches: ${this.totalBatch}`);

    while (this.currentBatch <= this.totalBatch) {
      const isCompleted = await this.runCurrentBatch(markCollection);
      if (isCompleted) console.log(`Batch ${this.currentBatch} Completed`);
      this.currentBatch++;
    }

    console.log('FixAnnotationLabelIDPatch End');
    return true;
  }

  async runCurrentBatch(collection) {
    console.log(`Running ${this.currentBatch} of ${this.totalBatch} Batches`);

    // get current batch marks
    const marks = await collection.find({
      'provenance.analysis.source': 'human',
      'provenance.analysis.type': 'label',
      'provenance.analysis.labelId': {$exists: false},
    }, {
      geometries: 0,
      skip: 0,
      limit: this.recordPerBatch,
    }).toArray();

    for (let idx = 0; idx < marks.length; idx++) {
      const mark = marks[idx];

      console.log(`(${idx+1}/${marks.length}) => mark Id: ${mark._id}`);
      const execId = mark.provenance.analysis.execution_id;
      const executionId = execId.slice(execId.lastIndexOf('_'));
      const labelType = mark.properties.annotations.notes;
      // check if the label type on current marks exist on label map
      var labelId;
      if (this.labelMap.has(labelType)) {
        const val = this.labelMap.get(labelType);
        labelId = val.id;
      } else {
        // create a random Id for missing label type
        labelId = randomId();
        this.labelMap.set(labelType, {id: labelId});
      }
      // update annotation
      const rs = await collection.updateOne({_id: new ObjectID(mark._id)}, {
        '$set': {
          'provenance.analysis.execution_id': executionId,
          'provenance.analysis.labelId': labelId,
          'provenance.analysis.name': labelType,
          'properties.annotations.id': executionId,
          'properties.annotations.labelId': labelId,
          'properties.annotations.name': labelType,
        },
      });
      if (rs.result.ok&&rs.result.nModified) {
        console.log('update success');
      } else {
        console.error('update fail');
      }
    }
    return true;
  }
}
async function start() {
  try {
    const patch = new FixAnnotationLabelIDPatch();
    const isCompleted = await patch.run();
    if (isCompleted) process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

start();
