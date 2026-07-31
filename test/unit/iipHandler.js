const chai = require('chai');
var iipHandlers = require('../../handlers/iipHandler.js');
var should = chai.should();

describe('iipHandler.rewritePath', function() {
  // Regression: same root cause as proxyHandler -- must use req.originalUrl,
  // not an already-mount-stripped path.
  it('Strips 2 leading segments from the full original URL', function(done) {
    var req = {originalUrl: '/img/IIP/raw/somefile.svs?FIF=somefile.svs'};
    iipHandlers.rewritePath(req).should.be.eql('/IIP/raw/somefile.svs?FIF=somefile.svs');
    done();
  });

  it('Removes the token query param', function(done) {
    var req = {originalUrl: '/img/IIP/raw/somefile.svs?FIF=somefile.svs&token=abc'};
    iipHandlers.rewritePath(req).should.be.eql('/IIP/raw/somefile.svs?FIF=somefile.svs');
    done();
  });

  it('Substitutes newFilepath for iipFileRequested when set', function(done) {
    var req = {
      originalUrl: '/img/IIP/raw/old.svs?token=abc',
      iipFileRequested: 'old.svs',
      newFilepath: 'new.svs',
    };
    iipHandlers.rewritePath(req).should.be.eql('/IIP/raw/new.svs');
    done();
  });
});
