'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var combinedStream = require('combined-stream');

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var logs =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var configuration, containers, env, follow, passThrough, environmentVariables, containerNames, childProcesses, multiStream, outputStream;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (options) {
              _context.next = 2;
              break;
            }

            throw new Error('Options are missing');

          case 2:
            if (options.configuration) {
              _context.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.containers) {
              _context.next = 6;
              break;
            }

            throw new Error('Containers are missing');

          case 6:
            if (options.env) {
              _context.next = 8;
              break;
            }

            throw new Error('Environment is missing.');

          case 8:
            if (!(options.follow === undefined)) {
              _context.next = 10;
              break;
            }

            throw new Error('Follow is missing.');

          case 10:
            configuration = options.configuration, containers = options.containers, env = options.env, follow = options.follow, passThrough = options.passThrough;
            _context.next = 13;
            return getEnvironmentVariables({
              configuration: configuration,
              env: env
            });

          case 13:
            environmentVariables = _context.sent;
            containerNames = containers.map(function (container) {
              return container.name;
            });
            childProcesses = [];
            _context.next = 18;
            return Promise.all(containerNames.map(function (containerName) {
              return new Promise(function (resolve) {
                var args = ['logs', containerName];

                if (follow) {
                  args.push('--follow');
                }

                var child = shell.spawn('docker', args, {
                  env: environmentVariables,
                  stdio: 'pipe'
                });
                child.once('close', function (code) {
                  if (code !== 0) {
                    childProcesses.forEach(function (process) {
                      process.kill();
                    });
                    /* eslint-disable no-process-exit */

                    process.exit(1);
                    /* eslint-enable no-process-exit */
                  }
                });
                childProcesses.push(child);
                resolve();
              });
            }));

          case 18:
            multiStream = combinedStream.create();
            childProcesses.map(function (child) {
              return child.stdout;
            }).forEach(function (stream) {
              return multiStream.append(stream);
            });
            outputStream = passThrough || process.stdout;
            _context.next = 23;
            return new Promise(function (resolve, reject) {
              multiStream.once('error', reject);
              multiStream.once('end', resolve);
              multiStream.pipe(outputStream);
            });

          case 23:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function logs(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = logs;