var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    ChildKiller = require('ChildKiller');

function BrowserStackTunnel(key, hosts, jarFile) {
  jarFile = jarFile || __dirname + '/../bin/BrowserStackTunnel.jar';
  var params = '';
  hosts.forEach(function(host) {
    if (params.length > 0) {
      params += ',';
    }
    params += host.name + ',' + host.port + ',' + host.sslFlag;
  });
  ChildKiller.call(
    this,
    'java',
    ['-jar', jarFile, key, params],
    new RegExp('Press Ctrl-C to exit')
  );
}
util.inherits(BrowserStackTunnel, ChildKiller);

module.exports = BrowserStackTunnel;