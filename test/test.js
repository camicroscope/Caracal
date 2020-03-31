const chai = require('chai');
const chaiHttp = require('chai-http');

const server = require('../caracal.js')

var should = chai.should();
chai.use(chaiHttp);


const posturl = '/data/Slide/post';
const findurl = '/data/Slide/find';
const deleteurl = '/data/Slide/delete';

process.env.DISABLE_SEC = "true"
var PORT = 8010;

describe('Slide Lifecycle Step 1', function() {
  it('Posts a Slide', function(done) {
    this.timeout(5000);
    var slideData = {'name': 'TEST', 'specimen': '', 'study': '', 'location': '/images/sample.svs', 'mpp': 0.499};
    chai.request(server)
    .post(posturl)
    .set('Content-Type', 'application/json; charset=utf-8')
    .send(slideData)
    .end(function(err, res){
      (res).should.have.status(200);
      (res.body).should.be.a('object');
      (res.body.insertedCount).should.be.eql(1);
      done();
    });
  });
});
/**
describe('Slide Lifecycle Step 2', function() {
  // can we see it in find
  it('Finds the added slide', function(done) {
    this.timeout(5000);
    const getProcess = fetch(findurl);
    getProcess.then((x)=>x.json()).then((x)=>{
      console.log(x);
      assert.equal(x.length, 1, 'Slide Shows up in API List');
      done();
    }).catch((e)=>{
      console.log('err');
      console.log(e);
      done(e);
    });
  });
});

describe('Slide Lifecycle Step 3', function() {
  it('Deletes a Slide', function(done) {
    this.timeout(5000);
    var deleteProcess = fetch(deleteurl, {
      'method': 'DELETE',
      'mode': 'cors',
      'headers': {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    deleteProcess.then((x)=>x.json()).then((x)=>{
      console.log(x);
      assert.equal(x.result.n, 1, 'Delete Reported Successful');
      done();
    }).catch((e)=>{
      console.log('err');
      console.log(e);
      done(e);
    });
  });
});
**/
