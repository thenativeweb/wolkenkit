'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var destroyData = require('../shared/destroyData'),
    docker = require('../../../docker'),
    errors = require('../../../errors'),
    getApplicationStatus = require('../shared/getApplicationStatus'),
    health = require('../health'),
    noop = require('../../../noop'),
    removeContainers = require('./removeContainers'),
    shared = require('../shared');

var stop = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var directory, dangerouslyDestroyData, env, configuration, existingContainers, debug, persistData, sharedKey, applicationStatus;
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
            if (!(options.dangerouslyDestroyData === undefined)) {
              _context.next = 6;
              break;
            }

            throw new Error('Dangerously destroy data is missing.');

          case 6:
            if (options.env) {
              _context.next = 8;
              break;
            }

            throw new Error('Environment is missing.');

          case 8:
            directory = options.directory, dangerouslyDestroyData = options.dangerouslyDestroyData, env = options.env;
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

            progress({ message: 'Verifying health on environment ' + env + '...', type: 'info' });
            _context.next = 17;
            return health({ directory: directory, env: env }, progress);

          case 17:
            _context.next = 19;
            return docker.getContainers({
              configuration: configuration,
              env: env,
              where: { label: { 'wolkenkit-application': configuration.application } }
            });

          case 19:
            existingContainers = _context.sent;


            progress({ message: 'Verifying application status...', type: 'info' });

            // We can not use the application status here, because for that we need to
            // fetch the labels of the containers. So this would be a chicken-and-egg
            // problem, hence this workaround.

            if (!(existingContainers.length === 0)) {
              _context.next = 24;
              break;
            }

            progress({ message: 'The application is not running.', type: 'info' });
            throw new errors.ApplicationNotRunning();

          case 24:
            debug = existingContainers[0].labels['wolkenkit-debug'] === 'true', persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true', sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];
            _context.next = 27;
            return getApplicationStatus({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 27:
            applicationStatus = _context.sent;


            if (applicationStatus === 'partially-running') {
              progress({ message: 'The application is partially running.', type: 'info' });
            }

            progress({ message: 'Removing Docker containers...', type: 'info' });
            _context.next = 32;
            return removeContainers({ configuration: configuration, env: env }, progress);

          case 32:

            progress({ message: 'Removing network...', type: 'info' });
            _context.next = 35;
            return docker.removeNetwork({ configuration: configuration, env: env });

          case 35:
            if (!dangerouslyDestroyData) {
              _context.next = 39;
              break;
            }

            progress({ message: 'Destroying previous data...', type: 'info' });
            _context.next = 39;
            return destroyData({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 39:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function stop(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = stop;