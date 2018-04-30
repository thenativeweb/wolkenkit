'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var childProcess = require('child_process');

var processenv = require('processenv');

var errors = require('../errors');

var exec = function exec(command) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!command) {
    throw new Error('Command is missing.');
  }

  return new _promise2.default(function (resolve, reject) {
    var cwd = options.cwd || process.cwd(),
        env = options.env || processenv(),
        maxBuffer = options.maxBuffer || 1024 * 200;

    childProcess.exec(command, { cwd: cwd, env: env, maxBuffer: maxBuffer }, function (err, stdout, stderr) {
      if (err) {
        var ex = new errors.ExecutableFailed(stderr);

        ex.originError = err;
        ex.stdout = stdout;
        ex.stderr = stderr;

        return reject(ex);
      }

      resolve({ stdout: stdout, stderr: stderr });
    });
  });
};

module.exports = exec;