/* eslint-disable no-unused-vars */
const chai = require('chai');
const permissionHandler = require('../../handlers/permssionHandler.js');
const should = chai.should();

describe('permissionHandler', function () {
  it('Accepts if ok', function (done) {
    const req = {};
    const res = {};
    req.tokenInfo = { userType: 'nice' };
    this.timeout(5000);
    permissionHandler(['nice'], true)(req, res, function () {});
    req.permission_ok.should.be.eql(true);
    done();
  });
  it('Rejects if not', function (done) {
    const req = {};
    const res = {};
    req.tokenInfo = { userType: 'naughty' };
    this.timeout(5000);
    permissionHandler(['nice'], true)(req, res, function () {});
    req.permission_ok.should.be.eql(false);
    done();
  });
});
