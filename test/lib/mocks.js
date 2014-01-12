var util = require('util'),
	mocks = require('mocks'),
	EventEmitter = require('events').EventEmitter;

var childProcess = {
	cleanUp: function() {
	  process.removeAllListeners('mock:child_process:stdout:data');
	  process.removeAllListeners('mock:child_process:stderr:data');
	  process.removeAllListeners('mock:child_process:error');
	  process.removeAllListeners('mock:child_process:exit');	
	},

	spawn: function (cmd, args) {
		function std() {}

		function mockProcess(cmd, args) {
			var self = this;

			this.stdout = new std();
			this.stderr = new std();
			this.kill = function () {
				self.emit('exit');	
			};

			childProcess.cleanUp();

			process.on('mock:child_process:stdout:data', function(data) {
				self.stdout.emit('data', data);
			});

			process.on('mock:child_process:stderr:data', function(data) {
				self.stderr.emit('data', data);
			});

			process.on('mock:child_process:error', function(data) {
				self.emit('error', data);
			});

			process.on('mock:child_process:exit', function(data) {
				self.emit('exit', data);
			});
		}

		util.inherits(std, EventEmitter);
		util.inherits(mockProcess, EventEmitter);
		return new mockProcess(cmd, args);
	}		
};

var ServerResponse = function () {
	var response = new mocks.http.ServerResponse();
	response.pipe = function (stream) {
		stream.emit('finish');
	}

	return response;
};

var ServerRequest = {
	get: function(url, callback) {
		callback(ServerResponse());
	}
};

var fileSystem = {
	create: function () {
		function File(fileName) {
			this.fileName = fileName;
			this.close = function () {};
		}

		var fs = mocks.fs.create({
	      bin: {
	        'BrowserStackTunnel.jar': 1
	      }
	    });

		util.inherits(File, EventEmitter);
	    fs.createWriteStream = function(fileName){
	    	return new File();
	    };	

	    return fs;
	}	
};

exports.childProcessMock = childProcess;
exports.httpMock = ServerRequest;
exports.fsMock = fileSystem;