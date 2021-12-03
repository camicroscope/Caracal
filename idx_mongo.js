// Create indexes and essential defaults for mongo
// replace this file before startup (e.g. container mount) to change how this runs

const mongodb = require("../service/database");

function indexes(){
  db = "camic"
  mongodb.addIndex(db, "authorization", { "name": 1 }, { unique: true })
  mongodb.addIndex(db, "user", { "email": 1 }, { unique: true })
  mongodb.addIndex(db, "mark", {"provenance.image.slide": 1, "provenance.analysis.execution_id": 1, "footprint":1, "x":1, "y":1})
  mongodb.addIndex(db, "mark", {"provenance.image.slide":1,"provenance.analysis.execution_id":1,"provenance.analysis": 1})
  mongodb.addIndex(db, "mark", {"provenance.image.slide":1,"provenance.analysis": 1})
  mongodb.addIndex(db, "mark", {"provenance.image.slide": 1, "provenance.analysis.execution_id": 1})
  mongodb.addIndex(db, "mark", {"provenance.image.slide": 1, "provenance.analysis.source": 1})
  mongodb.addIndex(db, "mark", {"provenance.image.slide": 1})
  mongodb.addIndex(db, "mark", {"provenance.analysis.labelId": 1})
  mongodb.addIndex(db, "slide", {'study':1, 'specimen': 1, 'name': 1})
  mongodb.addIndex(db, "template", {'id': 1})
  mongodb.addIndex(db, "template", {'name': 1})
  mongodb.addIndex(db, "heatmap", {"provenance.image.slide": 1, "provenance.analysis.execution_id": 1})
  mongodb.addIndex(db, "heatmap", {"provenance.image.slide": 1})
  mongodb.addIndex(db, "heatmapEdit", {"provenance.image.slide":1, "provenance.analysis.execution_id":1, "user_id":1})
  mongodb.addIndex(db, "configuration", {'config_name': 1}, { unique: true })
}

function collections(){
  db = "camic"
  mongodb.createCollection(db, "slide", {
      validator: {
          $jsonSchema: {
              bsonType: 'object',
              required: ['name', 'location'],
              properties: {
                  name: {
                      bsonType: 'string',
                      description: 'Slide display name',
                  },
                  location: {
                      bsonType: 'string',
                      description: 'Slide location, used for opening',
                  },
              },
          }
      }
  })

  mongodb.createCollection(db, "mark", {
      validator: {
          $jsonSchema: {
              bsonType: 'object',
              required: ['provenance'],
              properties: {
                  provenance: {
                      bsonType: 'object',
                      required: ['image', 'analysis'],
                      properties: {
                          image: {
                              bsonType: 'object',
                              required: ['slide'],
                          },
                          analysis: {
                              bsonType: 'object',
                              required: ['execution_id'],
                          },
                      },
                  },
              },
          }
      }
  })

  mongodb.createCollection(db, "heatmap", {
      validator: {
          $jsonSchema: {
              bsonType: 'object',
              required: ['provenance'],
              properties: {
                  provenance: {
                      bsonType: 'object',
                      required: ['image', 'analysis'],
                      properties: {
                          image: {
                              bsonType: 'object',
                              required: ['slide'],
                          },
                          analysis: {
                              bsonType: 'object',
                              required: ['execution_id'],
                          },
                      },
                  },
              },
          }
      }
  })

  mongodb.createCollection(db, "heatmapedit", {
      validator: {
          $jsonSchema: {
              bsonType: 'object',
              required: ['user_id', 'provenance'],
              properties: {
                  provenance: {
                      bsonType: 'object',
                      required: ['image', 'analysis'],
                      properties: {
                          image: {
                              bsonType: 'object',
                              required: ['slide'],
                          },
                          analysis: {
                              bsonType: 'object',
                              required: ['fields', 'execution_id'],
                          },
                      },
                  },
              },
          }
      }
  })

  mongodb.createCollection(db, "template", {
      validator: {
          $jsonSchema: {
              bsonType: 'object',
              required: ['id', 'name', 'properties'],
              properties: {
                  id: {
                      bsonType: 'string',
                      description: 'template identifier',
                  },
                  name: {
                      bsonType: 'string',
                      description: 'template display name',
                  },
                  properties: {
                      bsonType: 'object',
                      description: 'pure-form questions object',
                      additionalProperties: {
                          bsonType: 'object',
                          required: ['title', 'type'],
                      },
                  },
              },
          }
      }
  })
}

module.exports = {
  indexes: indexes,
  collections: collections
}
