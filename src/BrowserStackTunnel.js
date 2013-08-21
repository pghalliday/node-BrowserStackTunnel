var util = require('util'),
  http = require('http'),
  fs = require('fs'),
  path = require('path'),
  EventEmitter = require('events').EventEmitter,
  spawn = require('child_process').spawn;

function BrowserStackTunnel(options) {
  'use strict';
  var params = '',
    defaultJarPath = util.format('%s/bin/BrowserStackTunnel.jar', path.resolve('.'));

  this.stdoutData = '';
  this.tunnel = null;
    
  options.jarFile = options.jarFile || defaultJarPath;
  options.hosts.forEach(function (host) {
    if (params.length > 0) {
      params += ',';
    }
    params += host.name + ',' + host.port + ',' + host.sslFlag;
  });

  this.state = 'stop';
  this.stateMatchers = {
    'already_running': new RegExp('\\*\\*Error: There is another JAR already running'),
    'invalid_key': new RegExp('\\*\\*Error: You provided an invalid key'),
    'connection_failure': new RegExp('\\*\\*Error: Could not connect to server'),
    'newer_avalible': new RegExp('There is a new version of BrowserStackTunnel.jar available on server'),
    'started': new RegExp('Press Ctrl-C to exit')
  };

  this.on('newer_avalible', function () {
    this.killTunnel();

    var self = this,
      new_browserstack_lib = fs.createWriteStream(options.jarFile);

    http.get('http://www.browserstack.com/BrowserStackTunnel.jar', function (response) {
      console.log('Downloading newer version...');
      
      new_browserstack_lib.on('finish', function () {
        console.log('Downloading... Done');
        new_browserstack_lib.close();
        self.startTunnel();
      });

      response.pipe(new_browserstack_lib);
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
    if (this.state !== 'started' && this.state !== 'newer_avalible') {
      this.emit('started', new Error('child failed to start:\n' + this.stdoutData));
    } else if (this.state !== 'newer_avalible') {
      this.state = 'stop';
      this.emit('stop');
    }
  };

  this.startTunnel = function () {
    if (!fs.existsSync(options.jarFile)) {
      this.exit();
      return;
    }

    this.stdoutData = '';
    this.tunnel = spawn('java', ['-jar', options.jarFile, options.key, params]);
    this.tunnel.stdout.on('data', this.updateState.bind(this));
    this.tunnel.stderr.on('data', this.updateState.bind(this));
    this.tunnel.on('error', this.killTunnel.bind(this));
    this.tunnel.on('exit', this.exit.bind(this));
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