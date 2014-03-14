var path = require('path'),
    https = require('https'),
    unzip = require('unzip'),
    fstream = require('fstream');

function ZipBinary(platform, arch, filename) {
  'use strict';

  var self = this;
  self.path = filename || path.resolve(path.join(__dirname, '..', 'bin', platform, arch, 'BrowserStackLocal'));
  self.command = self.path;
  self.args = [];

  self.update = function (callback) {
    var binaryFileStream = fstream.Writer(self.path);
    https.get('https://www.browserstack.com/browserstack-local/BrowserStackLocal-' + platform + '-' + arch + '.zip', function (response) {
      console.log('Downloading newer version...');
      binaryFileStream.on('finish', function () {
        console.log('Downloading... Done');
        binaryFileStream.close();
        callback();
      });
      response.pipe(unzip.Parse()).pipe(binaryFileStream);
    });
  };
}

module.exports = ZipBinary;
