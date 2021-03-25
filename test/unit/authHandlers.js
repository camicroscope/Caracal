/* eslint-disable no-unused-vars */
const chai = require('chai');
const auth = require('../../handlers/authHandlers.js');
const should = chai.should();

process.env.DISABLE_SEC = 'true';

describe('filterHandler', function () {
  it('Filters on a given field', function (done) {
    const req = {};
    const res = {};
    req.filter = ['LOW_SEC'];
    req.data = [
      { name: 'public' },
      { name: 'low security', filter: 'LOW_SEC' },
      { name: 'high security', filter: 'HIGH_SEC' },
    ];
    this.timeout(5000);
    auth.filterHandler('data', 'filter', 'filter')(req, res, function () {});
    req.data.should.be.an('array');
    req.data.length.should.be.eql(2);
    done();
  });
  it('Returns all for special command **', function (done) {
    const req = {};
    const res = {};
    req.filter = ['**'];
    req.data = [
      { name: 'public' },
      { name: 'low security', filter: 'LOW_SEC' },
      { name: 'high security', filter: 'HIGH_SEC' },
    ];
    this.timeout(5000);
    auth.filterHandler('data', 'filter', 'filter')(req, res, function () {});
    req.data.should.be.an('array');
    req.data.length.should.be.eql(3);
    done();
  });
});
