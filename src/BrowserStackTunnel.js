var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    spawn = require('child_process').spawn;

function BrowserStackTunnel(key, hosts, jarFile) {
  var self = this,
      started = false,
      child,
      processEndEvents = [
        'SIGTERM',
        'SIGINT',
        'SIGHUP',
        'uncaughtException',
        'exit'
      ];

  jarFile = jarFile || __dirname + '/../bin/BrowserStackTunnel.jar';

  function killChild() {
    child.kill('SIGINT');
    child = null;
  }

  function onProcessExit() {
    if (child) {
      killChild();
    }
  }
  
  function addProcessEndEventListeners() {
    processEndEvents.forEach(function(event) {
      process.on(event, onProcessExit);
    });
  }

  function removeProcessEndEventListeners() {
    processEndEvents.forEach(function(event) {
      process.removeListener(event, onProcessExit);
    });
  }
  
  self.start = function(callback) {
    self.once('start', callback);
    if (started) {
      self.emit('start', new Error('tunnel already started'));
    } else {
      var stdoutData = '';
      var stdout;
      
      var params = '';
      hosts.forEach(function(host) {
        if (params.length > 0) {
          params += ',';
        }
        params += host.name + ',' + host.port + ',' + host.sslFlag;
      });
      child = spawn('java', ['-jar', jarFile, key, params], {
        detached: true
      });
      addProcessEndEventListeners();
      child.stderr.on('data', function(data) {
        stdoutData += data;
      });

      child.on('exit', function(code, signal) {
        removeProcessEndEventListeners();
        if (!started) {
          self.emit('start', new Error('tunnel failed to start:\n' + stdoutData));
        } else {
          started = false;
          self.emit('stop');
        }
      });

      child.stdout.setEncoding();
      child.stdout.on('data', function(data) {
        stdoutData += data.toString();
        var match = stdoutData.match(/Press Ctrl-C to exit/g);
        if (match && !started) {
          started = true;
          self.emit('start');
        }
      });
    }
  };
  
  self.stop = function(callback) {
    self.once('stop', callback);
    if (!started) {
      self.emit('stop', new Error('tunnel not active'));
    } else {
      killChild();
    }
  };
}
util.inherits(BrowserStackTunnel, EventEmitter);

module.exports = BrowserStackTunnel;