var expect = require('expect.js');
var path = require('path');

var mocks = require('mocks'),
    httpMock = require('../lib/mocks').httpMock,
    fstreamMock = require('../lib/mocks').fstreamMock,
    unzipMock = require('../lib/mocks').unzipMock;

var zb = mocks.loadFile('./src/ZipBinary.js', {
  https: httpMock,
  fstream: fstreamMock,
  unzip: unzipMock
});
var ZipBinary = zb.ZipBinary;

var PLATFORM = 'platform';
var ARCH = 'arch';
var DEFAULT_BINARY_FILE = path.resolve(path.join(__dirname, '../../bin', PLATFORM, ARCH, 'BrowserStackLocal'));
var OTHER_BINARY_FILE = '/bin/tunnel';
var ZIP_URL = 'https://www.browserstack.com/browserstack-local/BrowserStackLocal-' + PLATFORM + '-' + ARCH + '.zip';

describe('ZipBinary', function () {
  'use strict';

  var zipBinary;

  beforeEach(function () {
    fstreamMock.fileName = undefined;
    httpMock.url = undefined;
  });

  describe('with default binary path', function () {
    beforeEach(function () {
      zipBinary = new ZipBinary(PLATFORM, ARCH);
    });

    it('should have the correct path', function () {
      expect(zipBinary.path).to.equal(DEFAULT_BINARY_FILE);
    });

    it('should have the correct command', function () {
      expect(zipBinary.command).to.equal(DEFAULT_BINARY_FILE);
    });

    it('should have the correct args', function () {
      expect(zipBinary.args).to.eql([]);
    });

    describe('#update', function () {
      it('should download the jar file', function (done) {
        zipBinary.update(function () {
          expect(fstreamMock.fileName).to.equal(DEFAULT_BINARY_FILE);
          expect(httpMock.url).to.equal(ZIP_URL);
          done();
        });
      });
    });
  });

  describe('with given binary path', function () {
    beforeEach(function () {
      zipBinary = new ZipBinary(PLATFORM, ARCH, OTHER_BINARY_FILE);
    });

    it('should have the correct path', function () {
      expect(zipBinary.path).to.equal(OTHER_BINARY_FILE);
    });

    it('should have the correct command', function () {
      expect(zipBinary.command).to.equal(OTHER_BINARY_FILE);
    });

    it('should have the correct args', function () {
      expect(zipBinary.args).to.eql([]);
    });

    describe('#update', function () {
      it('should download the jar file', function (done) {
        zipBinary.update(function () {
          expect(fstreamMock.fileName).to.equal(OTHER_BINARY_FILE);
          expect(httpMock.url).to.equal(ZIP_URL);
          done();
        });
      });
    });
  });
});
