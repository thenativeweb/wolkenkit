'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    getApplicationStatus = require('../shared/getApplicationStatus'),
    health = require('../health'),
    noop = require('../../../noop'),
    shared = require('../shared');

var status = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var directory, env, configuration, existingContainers, debug, persistData, sharedKey, applicationStatus;
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
            _context.next = 17;
            return docker.getContainers({
              configuration: configuration,
              env: env,
              where: { label: { 'wolkenkit-application': configuration.application } }
            });

          case 17:
            existingContainers = _context.sent;


            progress({ message: 'Verifying application status...', type: 'info' });

            // We can not use the application status here, because for that we need to
            // fetch the labels of the containers. So this would be a chicken-and-egg
            // problem, hence this workaround.

            if (!(existingContainers.length === 0)) {
              _context.next = 21;
              break;
            }

            throw new errors.ApplicationNotRunning();

          case 21:
            debug = existingContainers[0].labels['wolkenkit-debug'] === 'true', persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true', sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];
            _context.next = 24;
            return getApplicationStatus({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 24:
            applicationStatus = _context.sent;

            if (!(applicationStatus === 'partially-running')) {
              _context.next = 27;
              break;
            }

            throw new errors.ApplicationPartiallyRunning();

          case 27:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function status(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = status;