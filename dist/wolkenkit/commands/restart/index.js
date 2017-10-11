'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    health = require('../health'),
    noop = require('../../../noop'),
    shared = require('../shared'),
    start = require('../start'),
    stop = require('../stop');

var restart = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var directory, env, configuration, existingContainers, debug, persistData, port, sharedKey, startOptions;
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
            directory = options.directory, env = options.env;
            _context.next = 9;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: true
            }, progress);

          case 9:
            configuration = _context.sent;
            _context.next = 12;
            return shared.checkDocker({ configuration: configuration, env: env }, progress);

          case 12:

            progress({ message: 'Verifying health on environment ' + env + '...', type: 'info' });
            _context.next = 15;
            return health({ directory: directory, env: env }, progress);

          case 15:

            progress({ message: 'Verifying application status...', type: 'info' });
            _context.next = 18;
            return docker.getContainers({
              configuration: configuration,
              env: env,
              where: { label: { 'wolkenkit-application': configuration.application } }
            });

          case 18:
            existingContainers = _context.sent;

            if (!(existingContainers.length === 0)) {
              _context.next = 22;
              break;
            }

            progress({ message: 'The application is not running.', type: 'info' });
            throw new errors.ApplicationNotRunning();

          case 22:
            debug = existingContainers[0].labels['wolkenkit-debug'] === 'true', persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true', port = Number(existingContainers[0].labels['wolkenkit-api-port']), sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];


            progress({ message: 'Stopping the application on environment ' + env + '...', type: 'info' });
            _context.next = 26;
            return stop({ directory: directory, env: env, dangerouslyDestroyData: false }, progress);

          case 26:
            startOptions = { directory: directory, env: env, dangerouslyDestroyData: false, debug: debug, port: port };


            if (persistData) {
              startOptions.sharedKey = sharedKey;
            }

            progress({ message: 'Starting the application on environment ' + env + '...', type: 'info' });
            _context.next = 31;
            return start(startOptions, progress);

          case 31:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function restart(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = restart;