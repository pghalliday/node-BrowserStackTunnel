var BrowserStackTunnel = require('../../');

var browserStackTunnel = new BrowserStackTunnel(process.argv[2], [{
  name: process.argv[3],
  port: process.argv[4],
  sslFlag: process.argv[5]
}]);
browserStackTunnel.on('stop', function(error) {
  // I think this is necessary because we use fork, however I
  // don't know why the child.kill call isn't enough :s
  // Might have something to do with handling the process events
  // inside the BrowserStackTunnel instance but i don't know
  // why that woud be either!
  process.exit();
});
browserStackTunnel.start(function(error) {
  if (error) {
    process.send({error: error.toString()});	
  } else {
    process.send({});
  }
});
