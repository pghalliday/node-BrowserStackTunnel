var path = require('path'),
    http = require('http'),
    fs = require('fs');

function JarBinary(filename) {
  'use strict';

  var self = this;
  self.path = filename || path.resolve(path.join(__dirname, '..', 'bin', 'jar', 'BrowserStackTunnel.jar'));
  self.command = 'java';
  self.args = ['-jar', self.path];

  self.update = function (callback) {
    var jarFileStream = fs.createWriteStream(self.path);
    http.get('http://www.browserstack.com/BrowserStackTunnel.jar', function (response) {
      console.log('Downloading newer version...');
      jarFileStream.on('finish', function () {
        console.log('Downloading... Done');
        jarFileStream.close();
        callback();
      });
      response.pipe(jarFileStream);
    });
  };
}

module.exports = JarBinary;
