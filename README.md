node-BrowserStackTunnel
=========

[![Build Status](https://travis-ci.org/pghalliday/node-BrowserStackTunnel.png)](https://travis-ci.org/pghalliday/node-BrowserStackTunnel)
[![Dependency Status](https://gemnasium.com/pghalliday/node-BrowserStackTunnel.png)](https://gemnasium.com/pghalliday/node-BrowserStackTunnel)

A Node.js wrapper for the BrowserStack java tunnel client

http://www.browserstack.com/

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
  }],
  jarFile: 'your_jar_file', // optionally override the included BrowserStackTunnel.jar file
  tunnelIdentifier: 'my_tunnel', // optionally set the -tunnelIdentifier option
  skipCheck: true // optionally set the -skipCheck option
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