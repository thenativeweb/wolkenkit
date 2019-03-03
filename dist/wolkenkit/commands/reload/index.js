'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var arrayToSentence = require('array-to-sentence');

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    health = require('../health'),
    noop = require('../../../noop'),
    removeContainers = require('./removeContainers'),
    runtimes = require('../../runtimes'),
    shared = require('../shared'),
    startContainers = require('./startContainers');

var reload =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var directory,
        env,
        progress,
        configuration,
        type,
        existingContainers,
        dangerouslyExposeHttpPorts,
        debug,
        persistData,
        port,
        sharedKey,
        applicationStatus,
        connections,
        httpPorts,
        _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = _ref.directory, env = _ref.env;
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            _context.next = 8;
            return shared.getConfiguration({
              directory: directory,
              env: env,
              isPackageJsonRequired: true
            }, progress);

          case 8:
            configuration = _context.sent;
            _context.next = 11;
            return shared.validateCode({
              directory: directory
            }, progress);

          case 11:
            type = configuration.type;

            if (!(type === 'aufwind')) {
              _context.next = 14;
              break;
            }

            throw new Error('Reload on environment type aufwind is not possible.');

          case 14:
            _context.next = 16;
            return shared.checkDocker({
              configuration: configuration
            }, progress);

          case 16:
            progress({
              message: "Verifying health on environment ".concat(env, "..."),
              type: 'info'
            });
            _context.next = 19;
            return health({
              directory: directory,
              env: env
            }, progress);

          case 19:
            progress({
              message: 'Verifying application status...',
              type: 'info'
            });
            _context.next = 22;
            return docker.getContainers({
              configuration: configuration,
              where: {
                label: {
                  'wolkenkit-application': configuration.application.name
                }
              }
            });

          case 22:
            existingContainers = _context.sent;

            if (!(existingContainers.length === 0)) {
              _context.next = 26;
              break;
            }

            progress({
              message: "The application is not running.",
              type: 'info'
            });
            throw new errors.ApplicationNotRunning();

          case 26:
            dangerouslyExposeHttpPorts = existingContainers[0].labels['wolkenkit-dangerously-expose-http-ports'] === 'true', debug = existingContainers[0].labels['wolkenkit-debug'] === 'true', persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true', port = Number(existingContainers[0].labels['wolkenkit-api-port']), sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];
            _context.next = 29;
            return shared.getApplicationStatus({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: sharedKey
            }, progress);

          case 29:
            applicationStatus = _context.sent;

            if (!(applicationStatus === 'partially-running')) {
              _context.next = 33;
              break;
            }

            progress({
              message: "The application is partially running.",
              type: 'info'
            });
            throw new errors.ApplicationPartiallyRunning();

          case 33:
            progress({
              message: "Removing Docker containers...",
              type: 'info'
            });
            _context.next = 36;
            return removeContainers({
              configuration: configuration
            }, progress);

          case 36:
            progress({
              message: 'Building Docker images...',
              type: 'info'
            });
            _context.next = 39;
            return shared.buildImages({
              configuration: configuration,
              directory: directory
            }, progress);

          case 39:
            progress({
              message: 'Starting Docker containers...',
              type: 'info'
            });
            _context.next = 42;
            return startContainers({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              port: port,
              sharedKey: sharedKey
            }, progress);

          case 42:
            progress({
              message: "Using ".concat(sharedKey, " as shared key."),
              type: 'info'
            });
            _context.next = 45;
            return shared.waitForApplicationAndValidateLogs({
              configuration: configuration
            }, progress);

          case 45:
            if (!debug) {
              _context.next = 48;
              break;
            }

            _context.next = 48;
            return shared.attachDebugger({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: sharedKey
            }, progress);

          case 48:
            _context.next = 50;
            return runtimes.getConnections({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              forVersion: configuration.application.runtime.version,
              persistData: persistData,
              sharedKey: sharedKey
            });

          case 50:
            connections = _context.sent;

            if (dangerouslyExposeHttpPorts && connections.api.external.http && connections.fileStorage.external.http) {
              httpPorts = [connections.api.external.http.port, connections.fileStorage.external.http.port];
              progress({
                message: "Exposed HTTP ports ".concat(arrayToSentence(httpPorts), "."),
                type: 'warn'
              });
            }

          case 52:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function reload(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = reload;