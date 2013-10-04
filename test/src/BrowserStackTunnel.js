var expect = require('expect.js'),
  mocks = require('mocks'),
  childProcessMock = require('../lib/mocks').childProcessMock,
  httpMock = require('../lib/mocks').httpMock,
  fsMock = require('../lib/mocks').fsMock,
  bs = mocks.loadFile('./src/BrowserStackTunnel.js', {
    child_process: childProcessMock,
    http: httpMock,
    fs: fsMock.create({
      bin: {
        'BrowserStackTunnel.jar': 1
      }
    })
  });

var INVALID_JAR_FILE = './bin/unknown.jar',
    VALID_JAR_FILE = './bin/BrowserStackTunnel.jar',
    HOST_NAME = 'localhost',
    PORT = 8080,
    INVALID_PORT = 8081,
    SSL_FLAG = 0,
    CONFIG = require('../Support/BrowserStackConfig');

describe('BrowserStackTunnel', function () {
  'use strict';

  it('should start the tunnel using the default jar file included in the package', function (done) {
    var browserStackTunnel = new bs.BrowserStackTunnel({
      key: CONFIG.key,
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
      } else if (browserStackTunnel.state === 'started') {
        done();
      }
    });

    process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
  });
  
  it('should error if an invalid jar file is specified', function (done) {
    var browserStackTunnel = new bs.BrowserStackTunnel({
      key: CONFIG.key,
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
      key: CONFIG.key,
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
      key: CONFIG.key,
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
      key: CONFIG.key,
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

  it('should download new jar if promted that a new version exists, hence auto download doesnt work', function (done) {
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
      done();
    });

    process.emit('mock:child_process:stdout:data', 'monkey-----  **There is a new version of BrowserStackTunnel.jar available on server ----monkey');
    setTimeout(function () {
      process.emit('mock:child_process:stdout:data', 'monkey-----  Press Ctrl-C to exit ----monkey');
    }, 100);
  });

  after(function () {
    process.removeAllListeners('mock:child_process:stdout:data');
    process.removeAllListeners('mock:child_process:stderr:data');
    process.removeAllListeners('mock:child_process:error');
    process.removeAllListeners('mock:child_process:exit');
  });
});