'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    health = require('../health'),
    noop = require('../../../noop'),
    removeContainers = require('./removeContainers'),
    shared = require('../shared'),
    startContainers = require('./startContainers');

var reload =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var progress,
        directory,
        env,
        configuration,
        environment,
        existingContainers,
        debug,
        persistData,
        port,
        sharedKey,
        applicationStatus,
        _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (options) {
              _context.next = 3;
              break;
            }

            throw new Error('Options are missing.');

          case 3:
            if (options.directory) {
              _context.next = 5;
              break;
            }

            throw new Error('Directory is missing.');

          case 5:
            if (options.env) {
              _context.next = 7;
              break;
            }

            throw new Error('Environment is missing.');

          case 7:
            directory = options.directory, env = options.env;
            _context.next = 10;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: true
            }, progress);

          case 10:
            configuration = _context.sent;
            shared.validateCode({
              directory: directory
            }, progress);
            environment = configuration.environments[env];

            if (!(environment.type === 'aufwind')) {
              _context.next = 15;
              break;
            }

            throw new Error('Reload on environment type aufwind is not possible.');

          case 15:
            _context.next = 17;
            return shared.checkDocker({
              configuration: configuration,
              env: env
            }, progress);

          case 17:
            progress({
              message: "Verifying health on environment ".concat(env, "..."),
              type: 'info'
            });
            _context.next = 20;
            return health({
              directory: directory,
              env: env
            }, progress);

          case 20:
            progress({
              message: 'Verifying application status...',
              type: 'info'
            });
            _context.next = 23;
            return docker.getContainers({
              configuration: configuration,
              env: env,
              where: {
                label: {
                  'wolkenkit-application': configuration.application
                }
              }
            });

          case 23:
            existingContainers = _context.sent;

            if (!(existingContainers.length === 0)) {
              _context.next = 27;
              break;
            }

            progress({
              message: "The application is not running.",
              type: 'info'
            });
            throw new errors.ApplicationNotRunning();

          case 27:
            debug = existingContainers[0].labels['wolkenkit-debug'] === 'true', persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true', port = Number(existingContainers[0].labels['wolkenkit-api-port']), sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];
            _context.next = 30;
            return shared.getApplicationStatus({
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            }, progress);

          case 30:
            applicationStatus = _context.sent;

            if (!(applicationStatus === 'partially-running')) {
              _context.next = 34;
              break;
            }

            progress({
              message: "The application is partially running.",
              type: 'info'
            });
            throw new errors.ApplicationPartiallyRunning();

          case 34:
            progress({
              message: "Removing Docker containers...",
              type: 'info'
            });
            _context.next = 37;
            return removeContainers({
              configuration: configuration,
              env: env
            }, progress);

          case 37:
            progress({
              message: 'Building Docker images...',
              type: 'info'
            });
            _context.next = 40;
            return shared.buildImages({
              directory: directory,
              configuration: configuration,
              env: env
            }, progress);

          case 40:
            progress({
              message: 'Starting Docker containers...',
              type: 'info'
            });
            _context.next = 43;
            return startContainers({
              configuration: configuration,
              env: env,
              port: port,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            }, progress);

          case 43:
            progress({
              message: "Using ".concat(sharedKey, " as shared key."),
              type: 'info'
            });
            _context.next = 46;
            return shared.waitForApplicationAndValidateLogs({
              configuration: configuration,
              env: env
            }, progress);

          case 46:
            if (!debug) {
              _context.next = 49;
              break;
            }

            _context.next = 49;
            return shared.attachDebugger({
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            }, progress);

          case 49:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function reload(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = reload;