const chai = require('chai');
const {ObjectId} = require('mongodb');
const {hasQueryInjection} = require('../../handlers/queryUtil.js');
var should = chai.should();

describe('hasQueryInjection', function() {
  it('Allows plain scalar query values', function(done) {
    hasQueryInjection({name: 'TEST', age: '20'}).should.be.eql(false);
    done();
  });

  it('Allows an empty query', function(done) {
    hasQueryInjection({}).should.be.eql(false);
    done();
  });

  it('Rejects a bracket-notation operator object (?field[$ne]=x)', function(done) {
    hasQueryInjection({field: {'$ne': 'x'}}).should.be.eql(true);
    done();
  });

  it('Rejects an array value (?field[]=a&field[]=b)', function(done) {
    hasQueryInjection({field: ['a', 'b']}).should.be.eql(true);
    done();
  });

  it('Does not flag a server-constructed ObjectId instance', function(done) {
    // regression: editHandler legitimately rewrites req.query to
    // {_id: <ObjectId>} before routes like Slide/delete reach General.delete
    hasQueryInjection({_id: new ObjectId()}).should.be.eql(false);
    done();
  });
});
