const chai = require('chai');
const chaiHttp = require('chai-http');

const server = require('../../caracal.js');

const should = chai.should();
chai.use(chaiHttp);

const posturl = '/data/Slide/post';
const findurl = '/data/Slide/find';
const deleteurl = '/data/Slide/delete';

process.env.DISABLE_SEC = 'true';

describe('Slide Lifecycle Step 1', () => {
  it('Posts a Slide', function (done) {
    this.timeout(5000);
    const slideData = {
      name: 'TEST', specimen: '', study: '', location: '/images/sample.svs', mpp: 0.499,
    };
    chai.request(server)
      .post(posturl)
      .set('Content-Type', 'application/json; charset=utf-8')
      .send(slideData)
      .end((err, res) => {
        (res).should.have.status(200);
        (res.body).should.be.a('object');
        (res.body.insertedCount).should.be.eql(1);
        done();
      });
  });
});
describe('Slide Lifecycle Step 2', () => {
  it('Finds the Slide', function (done) {
    this.timeout(5000);
    chai.request(server)
      .get(`${findurl}?name=TEST`)
      .set('Content-Type', 'application/json; charset=utf-8')
      .end((err, res) => {
        (res).should.have.status(200);
        (res.body).should.be.an('array');
        (res.body.length).should.be.eql(1);
        done();
      });
  });
});
describe('Slide Lifecycle Step 3', () => {
  it('Deletes a Slide', function (done) {
    this.timeout(5000);
    chai.request(server)
      .delete(`${deleteurl}?name=TEST`)
      .set('Content-Type', 'application/json; charset=utf-8')
      .end((err, res) => {
        (res).should.have.status(200);
        (res.body).should.be.a('object');
        (res.body.result.n).should.be.eql(1);
        done();
      });
  });
});
