const chai = require('chai');
var mctileHandlers = require('../../handlers/mctileHandler.js');
var should = chai.should();

function mockRes() {
  var res = {};
  res.statusCode = null;
  res.jsonBody = null;
  res.status = function(code) {
    res.statusCode = code;
    return res;
  };
  res.json = function(body) {
    res.jsonBody = body;
    return res;
  };
  return res;
}

describe('preMct', function() {
  it('Parses a non-descriptor DeepZoom path', function(done) {
    var req = {query: {DeepZoom: 'slide_files/8/3_4.jpeg'}};
    var res = mockRes();
    var calledNext = false;
    mctileHandlers.preMct(req, res, function() {
      calledNext = true;
    });
    (req.mctFileRequested).should.be.eql('slide_files/8/3_4.jpeg');
    (req.mctIsDescriptor).should.be.eql(false);
    (calledNext).should.be.eql(true);
    done();
  });

  it('Strips the .dzi suffix for descriptor requests', function(done) {
    var req = {query: {DeepZoom: 'slide.dzi'}};
    var res = mockRes();
    var calledNext = false;
    mctileHandlers.preMct(req, res, function() {
      calledNext = true;
    });
    (req.mctFileRequested).should.be.eql('slide');
    (req.mctIsDescriptor).should.be.eql(true);
    (calledNext).should.be.eql(true);
    done();
  });

  it('Sets mctFileRequested to false when there is no DeepZoom param', function(done) {
    var req = {query: {}};
    var res = mockRes();
    var calledNext = false;
    mctileHandlers.preMct(req, res, function() {
      calledNext = true;
    });
    (req.mctFileRequested).should.be.eql(false);
    (calledNext).should.be.eql(true);
    done();
  });

  ['../../etc/passwd', 'a/../../b.dzi', 'a/./b', 'a//b', '.hidden'].forEach(
      function(payload) {
        it('Rejects a path-traversal payload: ' + payload, function(done) {
          var req = {query: {DeepZoom: payload}};
          var res = mockRes();
          var calledNext = false;
          mctileHandlers.preMct(req, res, function() {
            calledNext = true;
          });
          (calledNext).should.be.eql(false);
          (res.statusCode).should.be.eql(400);
          done();
        });
      });
});

describe('pathRewrite', function() {
  it('Passes the path through unchanged when nothing was requested', function(done) {
    var req = {mctFileRequested: false, query: {}};
    (mctileHandlers.pathRewrite('/some/path', req)).should.be.eql('/some/path');
    done();
  });

  it('Builds a descriptor path with no query string', function(done) {
    var req = {mctFileRequested: 'slide', mctIsDescriptor: true, query: {}};
    (mctileHandlers.pathRewrite('/ignored', req)).should.be.eql('/dzi/slide.dzi');
    done();
  });

  it('Builds a tile path with an encoded style param', function(done) {
    var req = {
      mctFileRequested: 'slide_files/8/3_4.jpeg',
      mctIsDescriptor: false,
      query: {style: 'a b'},
    };
    (mctileHandlers.pathRewrite('/ignored', req)).should.be.eql(
        '/dzi/slide_files/8/3_4.jpeg?style=a%20b');
    done();
  });

  it('Builds a tile path with no query string when there is no style', function(done) {
    var req = {
      mctFileRequested: 'slide_files/8/3_4.jpeg',
      mctIsDescriptor: false,
      query: {},
    };
    (mctileHandlers.pathRewrite('/ignored', req)).should.be.eql(
        '/dzi/slide_files/8/3_4.jpeg');
    done();
  });
});
