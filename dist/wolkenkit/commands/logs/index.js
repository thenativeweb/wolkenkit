'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    health = require('../health'),
    noop = require('../../../noop'),
    shared = require('../shared');

var logs = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var directory, env, follow, configuration, containers;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (options) {
              _context.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (!(options.follow === undefined)) {
              _context.next = 8;
              break;
            }

            throw new Error('Follow is missing.');

          case 8:
            directory = options.directory, env = options.env, follow = options.follow;
            _context.next = 11;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: true
            }, progress);

          case 11:
            configuration = _context.sent;
            _context.next = 14;
            return shared.checkDocker({ configuration: configuration, env: env }, progress);

          case 14:

            progress({ message: 'Verifying health on environment ' + env + '...' });
            _context.next = 17;
            return health({ directory: directory, env: env }, progress);

          case 17:
            _context.next = 19;
            return docker.getContainers({
              configuration: configuration,
              env: env,
              where: { label: { 'wolkenkit-application': configuration.application, 'wolkenkit-type': 'application' } }
            });

          case 19:
            containers = _context.sent;

            if (!(containers.length === 0)) {
              _context.next = 23;
              break;
            }

            progress({ message: 'The application is not running.', type: 'info' });
            throw new errors.ApplicationNotRunning();

          case 23:
            _context.next = 25;
            return docker.logs({ configuration: configuration, containers: containers, env: env, follow: follow });

          case 25:
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