node-BrowserStackTunnel
=========

[![Build Status](https://travis-ci.org/pghalliday/node-BrowserStackTunnel.png)](https://travis-ci.org/pghalliday/node-BrowserStackTunnel)
[![Dependency Status](https://gemnasium.com/pghalliday/node-BrowserStackTunnel.png)](https://gemnasium.com/pghalliday/node-BrowserStackTunnel)

A Node.js wrapper for the BrowserStack java tunnel client

http://www.browserstack.com/

## Features

- should start the tunnel using the default jar file included in the package
- should error if an invalid jar file is specified
- should error if stopped before started
- should error if no server listening on the specified host and port
- should error if started when already running
- should error if user provided an invalid key
- should download new jar if promted that a new version exists, hence auto download doesnt work

## Installation

```
npm install browserstacktunnel-wrapper
```

## API

```javascript
var BrowserStackTunnel = require('browserstacktunnel-wrapper');

var browserStackTunnel = new BrowserStackTunnel({
  key: YOUR_KEY,
  hosts: [{
    name: 'localhost',
    port: 8080,
    sslFlag: 0
  }]
});

browserStackTunnel.start(function(error) {
  if (error) {
    console.log(error);
  } else {
    // tunnel has started
    
    browserStackTunnel.stop(function(error) {
      if (error) {
        console.log(error);
      } else {
        // tunnel has stopped
      }
    });
  }
});
```

## Roadmap

- Nothing yet

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using `npm test`.

## License
Copyright (c) 2012 Peter Halliday  
Licensed under the MIT license.