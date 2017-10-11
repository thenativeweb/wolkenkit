'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var logs = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var configuration, containers, env, follow, environmentVariables, containerNames, childProcesses;
    return regeneratorRuntime.wrap(function _callee$(_context) {
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
            configuration = options.configuration, containers = options.containers, env = options.env, follow = options.follow;
            _context.next = 13;
            return getEnvironmentVariables({ configuration: configuration, env: env });

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

                var child = shell.spawn('docker', args, { env: environmentVariables, stdio: 'inherit' });

                child.on('close', function (code) {
                  if (code !== 0) {
                    childProcesses.forEach(function (process) {
                      process.kill();
                    });

                    /* eslint-disable no-process-exit */
                    process.exit(1);
                    /* eslint-enable no-process-exit */
                  }

                  resolve();
                });

                childProcesses.push(child);
              });
            }));

          case 18:
          case 'end':
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