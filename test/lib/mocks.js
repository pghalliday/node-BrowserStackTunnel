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
		process.nextTick(function () {
			stream.emit('finish');
		});
		return stream;
	}

	return response;
};

var ServerRequest = {
	get: function(url, callback) {
		ServerRequest.url = url;
		callback(ServerResponse());
	}
};

var fileSystem = mocks.fs.create({
  bin: {
    'BrowserStackTunnel.jar': 1,
  	darwin: {
      'BrowserStackTunnel': 1
  	},
  	linux32: {
      'BrowserStackTunnel': 1
  	},
  	linux64: {
      'BrowserStackTunnel': 1
  	}
  }
});

function File() {
	this.close = function () {};
}
util.inherits(File, EventEmitter);

fileSystem.createWriteStream = function (fileName) {
	fileSystem.fileName = fileName;
	return new File();
};

var fstream = {};
fstream.Writer = function (fileName) {
	fstream.fileName = fileName;
	return new File();
};

function Pipe() {
	this.pipe = function (stream) {
		this.on('finish', function () {
			process.nextTick(function () {
				stream.emit('finish');
			});
		});
		return stream;
	};
}
util.inherits(Pipe, EventEmitter);

var unzip = {};
unzip.Parse = function () {
	var pipe = new Pipe();
	return pipe;
};

exports.childProcessMock = childProcess;
exports.httpMock = ServerRequest;
exports.fsMock = fileSystem;
exports.fstreamMock = fstream;
exports.unzipMock = unzip;
