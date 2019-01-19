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
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, containers, follow, _ref$passThrough, passThrough, environmentVariables, containerNames, childProcesses, multiStream, outputStream;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, containers = _ref.containers, follow = _ref.follow, _ref$passThrough = _ref.passThrough, passThrough = _ref$passThrough === void 0 ? undefined : _ref$passThrough;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (containers) {
              _context.next = 5;
              break;
            }

            throw new Error('Containers are missing');

          case 5:
            if (!(follow === undefined)) {
              _context.next = 7;
              break;
            }

            throw new Error('Follow is missing.');

          case 7:
            _context.next = 9;
            return getEnvironmentVariables({
              configuration: configuration
            });

          case 9:
            environmentVariables = _context.sent;
            containerNames = containers.map(function (container) {
              return container.name;
            });
            childProcesses = [];
            _context.next = 14;
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

          case 14:
            multiStream = combinedStream.create();
            childProcesses.map(function (child) {
              return child.stdout;
            }).forEach(function (stream) {
              return multiStream.append(stream);
            });
            outputStream = passThrough || process.stdout;
            _context.next = 19;
            return new Promise(function (resolve, reject) {
              multiStream.once('error', reject);
              multiStream.once('end', resolve);
              multiStream.pipe(outputStream);
            });

          case 19:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function logs(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = logs;