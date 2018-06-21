'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    health = require('../health'),
    noop = require('../../../noop'),
    removeContainers = require('./removeContainers'),
    shared = require('../shared'),
    startContainers = require('./startContainers');

var reload = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var directory, env, configuration, environment, existingContainers, debug, host, persistData, port, sharedKey, applicationStatus;
    return _regenerator2.default.wrap(function _callee$(_context) {
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


            shared.validateCode({ directory: directory }, progress);

            environment = configuration.environments[env];

            if (!(environment.type === 'aufwind')) {
              _context.next = 14;
              break;
            }

            throw new Error('Reload on environment type aufwind is not possible.');

          case 14:
            _context.next = 16;
            return shared.checkDocker({ configuration: configuration, env: env }, progress);

          case 16:

            progress({ message: 'Verifying health on environment ' + env + '...', type: 'info' });
            _context.next = 19;
            return health({ directory: directory, env: env }, progress);

          case 19:

            progress({ message: 'Verifying application status...', type: 'info' });
            _context.next = 22;
            return docker.getContainers({
              configuration: configuration,
              env: env,
              where: { label: { 'wolkenkit-application': configuration.application } }
            });

          case 22:
            existingContainers = _context.sent;

            if (!(existingContainers.length === 0)) {
              _context.next = 26;
              break;
            }

            progress({ message: 'The application is not running.', type: 'info' });
            throw new errors.ApplicationNotRunning();

          case 26:
            debug = existingContainers[0].labels['wolkenkit-debug'] === 'true', host = existingContainers[0].labels['wolkenkit-api-host'], persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true', port = Number(existingContainers[0].labels['wolkenkit-api-port']), sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];
            _context.next = 29;
            return shared.getApplicationStatus({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 29:
            applicationStatus = _context.sent;

            if (!(applicationStatus === 'partially-running')) {
              _context.next = 33;
              break;
            }

            progress({ message: 'The application is partially running.', type: 'info' });
            throw new errors.ApplicationPartiallyRunning();

          case 33:

            progress({ message: 'Removing Docker containers...', type: 'info' });
            _context.next = 36;
            return removeContainers({ configuration: configuration, env: env }, progress);

          case 36:

            progress({ message: 'Building Docker images...', type: 'info' });
            _context.next = 39;
            return shared.buildImages({ directory: directory, configuration: configuration, env: env }, progress);

          case 39:

            progress({ message: 'Starting Docker containers...', type: 'info' });
            _context.next = 42;
            return startContainers({ configuration: configuration, env: env, port: port, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 42:

            progress({ message: 'Using ' + sharedKey + ' as shared key.', type: 'info' });
            progress({ message: 'Waiting for https://' + host + ':' + port + '/v1/ping to reply...', type: 'info' });

            _context.next = 46;
            return shared.waitForApplication({ configuration: configuration, env: env }, progress);

          case 46:
            if (!debug) {
              _context.next = 49;
              break;
            }

            _context.next = 49;
            return shared.attachDebugger({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 49:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function reload(_x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = reload;