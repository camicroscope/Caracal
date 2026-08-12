const chai = require('chai');
var proxyHandler = require('../../handlers/proxyHandler.js');
var should = chai.should();

describe('proxyHandler.rewritePath', function() {
  // Regression: http-proxy-middleware v3 no longer restores req.originalUrl
  // into req.url before pathRewrite runs, so this must use req.originalUrl
  // directly rather than an already-mount-stripped path -- otherwise routes
  // whose target expects the mount-name segment to survive (e.g.
  // /img/MCT/meta/ -> ca-mctile's /meta/<file>) silently collapse to '/'.
  it('Strips n leading segments from the full original URL', function(done) {
    proxyHandler.rewritePath('/loader/slide/delete?token=x', 2)
        .should.be.eql('/slide/delete?token=x');
    done();
  });

  it('Preserves a target-expected segment beyond the mount name', function(done) {
    proxyHandler.rewritePath('/img/MCT/meta/somefile?token=x', 3)
        .should.be.eql('/meta/somefile?token=x');
    done();
  });
});
