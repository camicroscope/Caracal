const chai = require('chai');
var permissionHandler = require('../../handlers/permssionHandler.js');
var should = chai.should();

describe('permissionHandler', function() {
  it('Accepts if ok', function(done) {
    var req = {};
    var res = {};
    req.tokenInfo = {'userType': 'nice'};
    this.timeout(5000);
    permissionHandler(['nice'], true)(req, res, function() {});
    (req.permission_ok).should.be.eql(true);
    done();
  });
  it('Rejects if not', function(done) {
    var req = {};
    var res = {};
    req.tokenInfo = {'userType': 'naughty'};
    this.timeout(5000);
    permissionHandler(['nice'], true)(req, res, function() {});
    (req.permission_ok).should.be.eql(false);
    done();
  });
});
