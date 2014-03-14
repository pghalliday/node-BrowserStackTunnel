var util = require('util'),
    fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    spawn = require('child_process').spawn,
    os = require('os'),
    JarBinary = require('./JarBinary'),
    ZipBinary = require('./ZipBinary');

function BrowserStackTunnel(options) {
  'use strict';
  var params = [];

  var binary;
  switch (os.platform) {
  case 'linux':
    switch (os.arch) {
    case 'x64':
      binary = new ZipBinary('linux', 'x64', options.linux64File);
      break;
    case 'ia32':
      binary = new ZipBinary('linux', 'ia32', options.linux32File);
      break;
    }
    break;
  case 'darwin':
    binary = new ZipBinary('darwin', 'x64', options.osxFile);
    break;
  default:
    binary = new JarBinary(options.jarFile);
    break;
  }

  this.stdoutData = '';
  this.tunnel = null;

  var hosts = '';
  options.hosts.forEach(function (host) {
    if (hosts.length > 0) {
      hosts += ',';
    }
    hosts += host.name + ',' + host.port + ',' + host.sslFlag;
  });
  params.push(hosts);

  if (options.tunnelIdentifier) {
    params.push('-tunnelIdentifier', options.tunnelIdentifier);
  }

  if (options.skipCheck) {
    params.push('-skipCheck');
  }

  this.state = 'stop';
  this.stateMatchers = {
    'already_running': new RegExp('\\*\\*Error: There is another JAR already running'),
    'invalid_key': new RegExp('\\*\\*Error: You provided an invalid key'),
    'connection_failure': new RegExp('\\*\\*Error: Could not connect to server'),
    'newer_available': new RegExp('There is a new version of BrowserStackTunnel.jar available on server'),
    'started': new RegExp('Press Ctrl-C to exit')
  };

  this.on('newer_available', function () {
    this.killTunnel();
    var self = this;
    binary.update(function () {
      self.startTunnel();
    });
  });

  this.on('invalid_key', function () {
    this.emit('started', new Error('Invalid key'));
  });

  this.on('connection_failure', function () {
    this.emit('started', new Error('Could not connect to server'));
  });

  this.on('already_running', function () {
    this.emit('started', new Error('child already started'));
  });

  this.updateState = function (data) {
    var state;
    this.stdoutData += data.toString();

    for (state in this.stateMatchers) {
      if (this.stateMatchers.hasOwnProperty(state) && this.stateMatchers[state].test(this.stdoutData) && this.state !== state) {
        this.state = state;
        this.emit(state, null);
        break;
      }
    }
  };

  this.killTunnel = function () {
    if (this.tunnel) {
      this.tunnel.stdout.removeAllListeners('data');
      this.tunnel.stderr.removeAllListeners('data');
      this.tunnel.removeAllListeners('error');
      this.tunnel.kill();
      this.tunnel = null;
    }
  };

  this.exit = function () {
    if (this.state !== 'started' && this.state !== 'newer_available') {
      this.emit('started', new Error('child failed to start:\n' + this.stdoutData));
    } else if (this.state !== 'newer_available') {
      this.state = 'stop';
      this.emit('stop');
    }
  };

  this.cleanUp = function () {
    this.stdoutData = '';
    process.removeListener('uncaughtException', this.exit.bind(this));
  };

  this.startTunnel = function () {
    if (!fs.existsSync(binary.path)) {
      this.exit();
      return;
    }

    this.cleanUp();
    this.tunnel = spawn(binary.command, binary.args.concat([options.key]).concat(params));
    this.tunnel.stdout.on('data', this.updateState.bind(this));
    this.tunnel.stderr.on('data', this.updateState.bind(this));
    this.tunnel.on('error', this.killTunnel.bind(this));
    this.tunnel.on('exit', this.exit.bind(this));

    process.on('uncaughtException', this.killTunnel.bind(this));
  };

  this.start = function (callback) {
    this.once('started', callback);
    if (this.state === 'started') {
      this.emit('already_running');
    } else {
      this.startTunnel();
    }
  };

  this.stop = function (callback) {
    this.once('stop', callback);
    if (this.state !== 'started') {
      this.emit('stop', new Error('child not started'));
    }

    this.killTunnel();
  };
}

util.inherits(BrowserStackTunnel, EventEmitter);
module.exports = BrowserStackTunnel;