var expect = require('expect.js'),
    mocks = require('mocks'),
    childProcessMock = require('../lib/mocks').childProcessMock,
    httpMock = require('../lib/mocks').httpMock,
    fsMock = require('../lib/mocks').fsMock,
    fstreamMock = require('../lib/mocks').fstreamMock,
    unzipMock = require('../lib/mocks').unzipMock,
    sinon = require('sinon');

var spawnSpy = sinon.spy(childProcessMock.spawn);
childProcessMock.spawn = spawnSpy;

var jb = mocks.loadFile('./src/JarBinary.js', {
  http: httpMock,
  fs: fsMock
});
var JarBinary = jb.JarBinary;

var zb = mocks.loadFile('./src/ZipBinary.js', {
  https: httpMock,
  fstream: fstreamMock,
  unzip: unzipMock
});
var ZipBinary = zb.ZipBinary;

var osMock = {};

var bs = mocks.loadFile('./src/BrowserStackTunnel.js', {
  child_process: childProcessMock,
  http: httpMock,
  fs: fsMock,
  os: osMock,
  './JarBinary': JarBinary,
  './ZipBinary': ZipBinary
});

var INVALID_JAR_FILE = '/bin/unknown.jar',
    VALID_JAR_FILE = '/bin/BrowserStackTunnel.jar',
    OSX_BINARY_FILE = '/bin/darwin/BrowserStackTunnel',
    LINUX_64_BINARY_FILE = '/bin/linux64/BrowserStackTunnel',
    LINUX_32_BINARY_FILE = '/bin/linux32/BrowserStackTunnel',
    JAR_URL = 'http://www.browserstack.com/BrowserStackTunnel.jar',
    OSX_BINARY_URL = 'https://www.browserstack.com/browserstack-local/BrowserStackLocal-darwin-x64.zip',
    LINUX_64_BINARY_URL = 'https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip',
    LINUX_32_BINARY_URL = 'https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-ia32.zip',
    HOST_NAME = 'localhost',
    PORT = 8080,
    INVALID_PORT = 8081,
    SSL_FLAG = 0,
    KEY = 'This is a fake key',
    HOST_NAME2 = 'localhost2',
    PORT2 = 8081,
    SSL_FLAG2 = 1;

describe('BrowserStackTunnel', function () {
  'use strict';

  beforeEach(function () {
    fsMock.fileName = undefined;
    fstreamMock.fileName = undefined;
    httpMock.url = undefined;
    osMock.platform = 'unknown';
    osMock.arch = 'unknown';
  });
  
  it('should error if an invalid jar file is specified', function (done) {
    var browserStackTunnel = new bs.BrowserStackTunnel({
      key: KEY,
      hosts: [{
        name: HOST_NAME,
        port: PORT,
        sslFlag: SSL_FLAG
      }],
      jarFile: INVALID_JAR_FILE
    });
    browserStackTunnel.start(function (error) {
      expect(error.message).to.contain('child failed to start');
      done();
    });
  });
  
  it('should error if stopped before started', function (done) {
    var browserStackTunnel = new bs.BrowserStackTunnel({
      key: KEY,
      hosts: [{
        name: HOST_NAME,
        port: PORT,
        sslFlag: SSL_FLAG
      }],
      jarFile: VALID_JAR_FILE
    });
    browserStackTunnel.stop(function (error) {
      expect(error.message).to.be('child not started');
      done();
    });
  });
  
  it('should error if no server listening on the specified host and port', function (done) {
    var browserStackTunnel = new bs.BrowserStackTunnel({
      key: KEY,
      hosts: [{
        name: HOST_NAME,
        port: INVALID_PORT,
        sslFlag: SSL_FLAG
      }],
      jarFile: VALID_JAR_FILE
    });
    browserStackTunnel.start(function (error) {
      expect(error.message).to.contain('Could not connect to server');
      done();
    });

    process.emit('mock:child_process:stdout:data', 'monkey-----  **Error: Could not connect to server: ----monkey');
  });

  it('should error if user provided an invalid key', function (done) {
    var browserStackTunnel = new bs.BrowserStackTunnel({
      key: 'MONKEY_KEY',
      hosts: [{
        name: HOST_NAME,
        port: PORT,
        sslFlag: SSL_FLAG
      }],
      jarFile: VALID_JAR_FILE
    });
    browserStackTunnel.start(function (error) {
      expect(error.message).to.contain('Invalid key');
      done();
    });

    process.emit('mock:child_process:stdout:data', 'monkey-----  **Error: You provided an invalid key ----monkey');
  });
  
  it('should error if started when already running', function (done) {
    var browserStackTunnel = new bs.BrowserStackTunnel({
      key: KEY,
      hosts: [{
        name: HOST_NAME,
        port: PORT,
        sslFlag: SSL_FLAG
      }],
      jarFile: VALID_JAR_FILE
    });

    browserStackTunnel.start(function (error) {
      if (error) {
        expect().fail(function () { return error; });
      }
      browserStackTunnel.start(function (error) {
        expect(error.message).to.be('child already started');
        done();
      });

      process.emit('mock:child_process:stdout:data', 'monkey-----  **Error: There is another JAR already running ----monkey');
    });

    process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
  });

  it('should download new jar if prompted that a new version exists, hence auto download doesnt work', function (done) {
    var browserStackTunnel = new bs.BrowserStackTunnel({
      key: 'MONKEY_KEY',
      hosts: [{
        name: HOST_NAME,
        port: PORT,
        sslFlag: SSL_FLAG
      }],
      jarFile: VALID_JAR_FILE
    });
    browserStackTunnel.start(function (error) {
      if (error) {
        expect().fail(function () { return error; });
      }
      expect(fsMock.fileName).to.equal(VALID_JAR_FILE);
      expect(httpMock.url).to.equal(JAR_URL);
      done();
    });

    process.emit('mock:child_process:stdout:data', 'monkey-----  **There is a new version of BrowserStackTunnel.jar available on server ----monkey');
    setTimeout(function () {
      process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
    }, 100);
  });

  it('should support multiple hosts', function (done) {
    spawnSpy.reset();
    var browserStackTunnel = new bs.BrowserStackTunnel({
      key: KEY,
      hosts: [{
        name: HOST_NAME,
        port: PORT,
        sslFlag: SSL_FLAG
      }, {
        name: HOST_NAME2,
        port: PORT2,
        sslFlag: SSL_FLAG2
      }],
      jarFile: VALID_JAR_FILE
    });
    browserStackTunnel.start(function (error) {
      if (error) {
        expect().fail(function () { return error; });
      } else if (browserStackTunnel.state === 'started') {
        sinon.assert.calledOnce(spawnSpy);
        sinon.assert.calledWithExactly(
          spawnSpy,
          'java', [
            '-jar',
            VALID_JAR_FILE,
            KEY,
            HOST_NAME + ',' + PORT + ',' + SSL_FLAG + ',' + HOST_NAME2 + ',' + PORT2 + ',' + SSL_FLAG2
          ]
        );
        done();
      }
    });

    process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
  });

  it('should use the specified jar file', function (done) {
    spawnSpy.reset();
    var browserStackTunnel = new bs.BrowserStackTunnel({
      key: KEY,
      hosts: [{
        name: HOST_NAME,
        port: PORT,
        sslFlag: SSL_FLAG,
        tunnelIdentifier: 'my_tunnel'
      }],
      jarFile: VALID_JAR_FILE
    });
    browserStackTunnel.start(function (error) {
      if (error) {
        expect().fail(function () { return error; });
      } else if (browserStackTunnel.state === 'started') {
        sinon.assert.calledOnce(spawnSpy);
        sinon.assert.calledWithExactly(
          spawnSpy,
          'java', [
            '-jar',
            VALID_JAR_FILE,
            KEY,
            HOST_NAME + ',' + PORT + ',' + SSL_FLAG
          ]
        );
        done();
      }
    });

    process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
  });

  it('should support the tunnelIdentifier option', function (done) {
    spawnSpy.reset();
    var browserStackTunnel = new bs.BrowserStackTunnel({
      key: KEY,
      hosts: [{
        name: HOST_NAME,
        port: PORT,
        sslFlag: SSL_FLAG
      }],
      tunnelIdentifier: 'my_tunnel',
      jarFile: VALID_JAR_FILE
    });
    browserStackTunnel.start(function (error) {
      if (error) {
        expect().fail(function () { return error; });
      } else if (browserStackTunnel.state === 'started') {
        sinon.assert.calledOnce(spawnSpy);
        sinon.assert.calledWithExactly(
          spawnSpy,
          'java', [
            '-jar',
            VALID_JAR_FILE,
            KEY,
            HOST_NAME + ',' + PORT + ',' + SSL_FLAG,
            '-tunnelIdentifier',
            'my_tunnel'
          ]
        );
        done();
      }
    });

    process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
  });

  it('should support the skipCheck option', function (done) {
    spawnSpy.reset();
    var browserStackTunnel = new bs.BrowserStackTunnel({
      key: KEY,
      hosts: [{
        name: HOST_NAME,
        port: PORT,
        sslFlag: SSL_FLAG
      }],
      skipCheck: true,
      jarFile: VALID_JAR_FILE
    });
    browserStackTunnel.start(function (error) {
      if (error) {
        expect().fail(function () { return error; });
      } else if (browserStackTunnel.state === 'started') {
        sinon.assert.calledOnce(spawnSpy);
        sinon.assert.calledWithExactly(
          spawnSpy,
          'java', [
            '-jar',
            VALID_JAR_FILE,
            KEY,
            HOST_NAME + ',' + PORT + ',' + SSL_FLAG,
            '-skipCheck'
          ]
        );
        done();
      }
    });

    process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
  });

  describe('on windows', function () {
    beforeEach(function () {
      osMock.platform = 'win32';
      osMock.arch = 'x64';
    });

    it('should download new jar if prompted that a new version exists, hence auto download doesnt work', function (done) {
      var browserStackTunnel = new bs.BrowserStackTunnel({
        key: 'MONKEY_KEY',
        hosts: [{
          name: HOST_NAME,
          port: PORT,
          sslFlag: SSL_FLAG
        }],
        jarFile: VALID_JAR_FILE
      });
      browserStackTunnel.start(function (error) {
        if (error) {
          expect().fail(function () { return error; });
        }
        expect(fsMock.fileName).to.equal(VALID_JAR_FILE);
        expect(httpMock.url).to.equal(JAR_URL);
        done();
      });

      process.emit('mock:child_process:stdout:data', 'monkey-----  **There is a new version of BrowserStackTunnel.jar available on server ----monkey');
      setTimeout(function () {
        process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
      }, 100);
    });

    it('should use the specified jar file', function (done) {
      spawnSpy.reset();
      var browserStackTunnel = new bs.BrowserStackTunnel({
        key: KEY,
        hosts: [{
          name: HOST_NAME,
          port: PORT,
          sslFlag: SSL_FLAG,
          tunnelIdentifier: 'my_tunnel'
        }],
        jarFile: VALID_JAR_FILE
      });
      browserStackTunnel.start(function (error) {
        if (error) {
          expect().fail(function () { return error; });
        } else if (browserStackTunnel.state === 'started') {
          sinon.assert.calledOnce(spawnSpy);
          sinon.assert.calledWithExactly(
            spawnSpy,
            'java', [
              '-jar',
              VALID_JAR_FILE,
              KEY,
              HOST_NAME + ',' + PORT + ',' + SSL_FLAG
            ]
          );
          done();
        }
      });

      process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
    });
  });

  describe('on osx', function () {
    beforeEach(function () {
      osMock.platform = 'darwin';
      osMock.arch = 'x64';
    });

    it('should download new jar if prompted that a new version exists, hence auto download doesnt work', function (done) {
      var browserStackTunnel = new bs.BrowserStackTunnel({
        key: 'MONKEY_KEY',
        hosts: [{
          name: HOST_NAME,
          port: PORT,
          sslFlag: SSL_FLAG
        }],
        osxFile: OSX_BINARY_FILE
      });
      browserStackTunnel.start(function (error) {
        if (error) {
          expect().fail(function () { return error; });
        }
        expect(fstreamMock.fileName).to.equal(OSX_BINARY_FILE);
        expect(httpMock.url).to.equal(OSX_BINARY_URL);
        done();
      });

      process.emit('mock:child_process:stdout:data', 'monkey-----  **There is a new version of BrowserStackTunnel.jar available on server ----monkey');
      setTimeout(function () {
        process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
      }, 100);
    });

    it('should use the specified jar file', function (done) {
      spawnSpy.reset();
      var browserStackTunnel = new bs.BrowserStackTunnel({
        key: KEY,
        hosts: [{
          name: HOST_NAME,
          port: PORT,
          sslFlag: SSL_FLAG,
          tunnelIdentifier: 'my_tunnel'
        }],
        osxFile: OSX_BINARY_FILE
      });
      browserStackTunnel.start(function (error) {
        if (error) {
          expect().fail(function () { return error; });
        } else if (browserStackTunnel.state === 'started') {
          sinon.assert.calledOnce(spawnSpy);
          sinon.assert.calledWithExactly(
            spawnSpy,
            OSX_BINARY_FILE, [
              KEY,
              HOST_NAME + ',' + PORT + ',' + SSL_FLAG
            ]
          );
          done();
        }
      });

      process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
    });
  });

  describe('on linux x64', function () {
    beforeEach(function () {
      osMock.platform = 'linux';
      osMock.arch = 'x64';
    });
 
    it('should download new jar if prompted that a new version exists, hence auto download doesnt work', function (done) {
      var browserStackTunnel = new bs.BrowserStackTunnel({
        key: 'MONKEY_KEY',
        hosts: [{
          name: HOST_NAME,
          port: PORT,
          sslFlag: SSL_FLAG
        }],
        linux64File: LINUX_64_BINARY_FILE
      });
      browserStackTunnel.start(function (error) {
        if (error) {
          expect().fail(function () { return error; });
        }
        expect(fstreamMock.fileName).to.equal(LINUX_64_BINARY_FILE);
        expect(httpMock.url).to.equal(LINUX_64_BINARY_URL);
        done();
      });

      process.emit('mock:child_process:stdout:data', 'monkey-----  **There is a new version of BrowserStackTunnel.jar available on server ----monkey');
      setTimeout(function () {
        process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
      }, 100);
    });

    it('should use the specified jar file', function (done) {
      spawnSpy.reset();
      var browserStackTunnel = new bs.BrowserStackTunnel({
        key: KEY,
        hosts: [{
          name: HOST_NAME,
          port: PORT,
          sslFlag: SSL_FLAG,
          tunnelIdentifier: 'my_tunnel'
        }],
        linux64File: LINUX_64_BINARY_FILE
      });
      browserStackTunnel.start(function (error) {
        if (error) {
          expect().fail(function () { return error; });
        } else if (browserStackTunnel.state === 'started') {
          sinon.assert.calledOnce(spawnSpy);
          sinon.assert.calledWithExactly(
            spawnSpy,
            LINUX_64_BINARY_FILE, [
              KEY,
              HOST_NAME + ',' + PORT + ',' + SSL_FLAG
            ]
          );
          done();
        }
      });

      process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
    });
  });

  describe('on linux ia32', function () {
    beforeEach(function () {
      osMock.platform = 'linux';
      osMock.arch = 'ia32';
    });

    it('should download new jar if prompted that a new version exists, hence auto download doesnt work', function (done) {
      var browserStackTunnel = new bs.BrowserStackTunnel({
        key: 'MONKEY_KEY',
        hosts: [{
          name: HOST_NAME,
          port: PORT,
          sslFlag: SSL_FLAG
        }],
        linux32File: LINUX_32_BINARY_FILE
      });
      browserStackTunnel.start(function (error) {
        if (error) {
          expect().fail(function () { return error; });
        }
        expect(fstreamMock.fileName).to.equal(LINUX_32_BINARY_FILE);
        expect(httpMock.url).to.equal(LINUX_32_BINARY_URL);
        done();
      });

      process.emit('mock:child_process:stdout:data', 'monkey-----  **There is a new version of BrowserStackTunnel.jar available on server ----monkey');
      setTimeout(function () {
        process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
      }, 100);
    });

    it('should use the specified jar file', function (done) {
      spawnSpy.reset();
      var browserStackTunnel = new bs.BrowserStackTunnel({
        key: KEY,
        hosts: [{
          name: HOST_NAME,
          port: PORT,
          sslFlag: SSL_FLAG,
          tunnelIdentifier: 'my_tunnel'
        }],
        linux32File: LINUX_32_BINARY_FILE
      });
      browserStackTunnel.start(function (error) {
        if (error) {
          expect().fail(function () { return error; });
        } else if (browserStackTunnel.state === 'started') {
          sinon.assert.calledOnce(spawnSpy);
          sinon.assert.calledWithExactly(
            spawnSpy,
            LINUX_32_BINARY_FILE, [
              KEY,
              HOST_NAME + ',' + PORT + ',' + SSL_FLAG
            ]
          );
          done();
        }
      });

      process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
    });
  });

  after(function () {
    childProcessMock.cleanUp();
  });
});