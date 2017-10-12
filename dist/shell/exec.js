'use strict';

var childProcess = require('child_process');

var processenv = require('processenv');

var errors = require('../errors');

var exec = function exec(command) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!command) {
    throw new Error('Command is missing.');
  }

  return new Promise(function (resolve, reject) {
    var cwd = options.cwd || process.cwd(),
        env = options.env || processenv();

    childProcess.exec(command, { cwd: cwd, env: env }, function (err, stdout, stderr) {
      if (err) {
        var ex = new errors.ExecutableFailed(stderr);

        ex.stdout = stdout;
        ex.stderr = stderr;

        return reject(ex);
      }

      resolve({ stdout: stdout, stderr: stderr });
    });
  });
};

module.exports = exec;