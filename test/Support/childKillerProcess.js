var ChildKiller = require('../../src/ChildKiller');

var childKiller = new ChildKiller('node', ['./test/Support/childProcess.js', process.argv[2]], {}, /Started/g);
childKiller.start(function(error) {
  if (error) {
    process.send({error: error.toString()});	
  } else {
    process.send({});
  }
});
