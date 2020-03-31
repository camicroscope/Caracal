
const assert = require('assert');

const fetch = require('node-fetch');
const posturl = 'http://localhost:8010/data/Slide/post';
const findurl = 'http://localhost:8010/data/Slide/find';
const deleteurl = 'http://localhost:8010/data/Slide/delete';

var PORT = 8010;

describe('Slide Lifecycle Step 1', function() {
  it('Posts a Slide', function(done) {
    this.timeout(5000);
    var slideData = {'name': 'TEST', 'specimen': '', 'study': '', 'location': '/images/sample.svs', 'mpp': 0.499};
    var postProcess = fetch(posturl, {
      'method': 'POST',
      'mode': 'cors',
      'headers': {
        'Content-Type': 'application/json; charset=utf-8',
        // "Content-Type": "application/x-www-form-urlencoded",
      },
      'body': JSON.stringify(slideData)});
    postProcess.then((x)=>x.json()).then((x)=>{
      console.log(x);
      assert.equal(x.insertedCount, 1, 'Post Reported Successful');
      done();
    }).catch((e)=>{
      console.log('err');
      console.log(e);
      done(e);
    });
  });
});
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
