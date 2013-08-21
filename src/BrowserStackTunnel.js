var util = require('util'),
  http = require('http'),
  fs = require('fs'),
  EventEmitter = require('events').EventEmitter,
  spawn = require('child_process').spawn;

function BrowserStackTunnel(options) {
  'use strict';
  var params = '',
      stdoutData = '',
      tunnel;
    
  options.jarFile = options.jarFile || __dirname + '/../bin/BrowserStackTunnel.jar';
  options.hosts.forEach(function (host) {
    if (params.length > 0) {
      params += ',';
    }
    params += host.name + ',' + host.port + ',' + host.sslFlag;
  });

  this.state = 'stop';
  this.stateMatchers = {
    'already_running': new RegExp('\\*\\*Error: There is another JAR already running.'),
    'invalid_key': new RegExp('\\*\\*Error: You provided an invalid key'),
    'newer_avalible': new RegExp('There is a new version of BrowserStackTunnel.jar available on server'),
    'start': new RegExp('Press Ctrl-C to exit')
  };

  this.on('newer_avalible', function () {
    this.killTunnel();

    var self = this,
      new_browserstack_lib = fs.createWriteStream(options.jarFile);

    http.get('http://www.browserstack.com/BrowserStackTunnel.jar', function (response) {
      console.log('Downloading newer version...');
      
      response.pipe(new_browserstack_lib);
      new_browserstack_lib.on('finish', function () {
        console.log('Downloading... Done');
        new_browserstack_lib.close();
        self.startTunnel();
      });
    });
  });

  this.on('invalid_key', function () {
    this.emit('start', new Error('Invalid key'));
  });

  this.on('already_running', function () {
    this.emit('start', new Error('child already started'));
  });

  this.updateState = function (data) {
    var state;

    stdoutData += data.toString();
    for (state in this.stateMatchers) {
      if (this.stateMatchers.hasOwnProperty(state) && this.stateMatchers[state].test(stdoutData) && this.state !== state) {
        this.state = state;
        this.emit(state, null);
        break;
      }
    }
  };

  this.killTunnel = function () {
    if (tunnel) {
      tunnel.stdout.removeListener('data', this.updateState.bind(this));
      tunnel.stderr.removeListener('data', this.updateState.bind(this));
      tunnel.removeListener('error', this.exit.bind(this));
      tunnel.kill();
      tunnel = null;
    }
  };

  this.exit = function () {
    if (this.state !== 'start') {
      this.emit('start', new Error('child failed to start:\n' + stdoutData));
    } else {
      this.state = 'stop';
      this.emit('stop');
    }

    this.killTunnel();
  };

  this.startTunnel = function () {
    tunnel = spawn('java', ['-jar', options.jarFile, options.key, params]);
    
    tunnel.stdout.on('data', this.updateState.bind(this));
    tunnel.stderr.on('data', this.updateState.bind(this));
    tunnel.on('error', this.exit.bind(this));
    tunnel.on('exit', this.exit.bind(this));
  };

  this.start = function (callback) {
    this.once('start', callback);
    if (this.state === 'start') {
      this.emit('already_running');
    } else {
      this.startTunnel();
    }    
  };

  this.stop = function (callback) {
    this.once('stop', callback);
    if (this.state !== 'start') {
      this.emit('start', new Error('child not started'));
    } 

    this.killTunnel();
  };
}

util.inherits(BrowserStackTunnel, EventEmitter);
module.exports = BrowserStackTunnel;