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
            shared.validateCode({
              directory: directory
            }, progress);
            type = configuration.type;

            if (!(type === 'aufwind')) {
              _context.next = 13;
              break;
            }

            throw new Error('Reload on environment type aufwind is not possible.');

          case 13:
            _context.next = 15;
            return shared.checkDocker({
              configuration: configuration
            }, progress);

          case 15:
            progress({
              message: "Verifying health on environment ".concat(env, "..."),
              type: 'info'
            });
            _context.next = 18;
            return health({
              directory: directory,
              env: env
            }, progress);

          case 18:
            progress({
              message: 'Verifying application status...',
              type: 'info'
            });
            _context.next = 21;
            return docker.getContainers({
              configuration: configuration,
              where: {
                label: {
                  'wolkenkit-application': configuration.application.name
                }
              }
            });

          case 21:
            existingContainers = _context.sent;

            if (!(existingContainers.length === 0)) {
              _context.next = 25;
              break;
            }

            progress({
              message: "The application is not running.",
              type: 'info'
            });
            throw new errors.ApplicationNotRunning();

          case 25:
            dangerouslyExposeHttpPorts = existingContainers[0].labels['wolkenkit-dangerously-expose-http-ports'] === 'true', debug = existingContainers[0].labels['wolkenkit-debug'] === 'true', persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true', port = Number(existingContainers[0].labels['wolkenkit-api-port']), sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];
            _context.next = 28;
            return shared.getApplicationStatus({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: sharedKey
            }, progress);

          case 28:
            applicationStatus = _context.sent;

            if (!(applicationStatus === 'partially-running')) {
              _context.next = 32;
              break;
            }

            progress({
              message: "The application is partially running.",
              type: 'info'
            });
            throw new errors.ApplicationPartiallyRunning();

          case 32:
            progress({
              message: "Removing Docker containers...",
              type: 'info'
            });
            _context.next = 35;
            return removeContainers({
              configuration: configuration
            }, progress);

          case 35:
            progress({
              message: 'Building Docker images...',
              type: 'info'
            });
            _context.next = 38;
            return shared.buildImages({
              configuration: configuration,
              directory: directory
            }, progress);

          case 38:
            progress({
              message: 'Starting Docker containers...',
              type: 'info'
            });
            _context.next = 41;
            return startContainers({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              port: port,
              sharedKey: sharedKey
            }, progress);

          case 41:
            progress({
              message: "Using ".concat(sharedKey, " as shared key."),
              type: 'info'
            });
            _context.next = 44;
            return shared.waitForApplicationAndValidateLogs({
              configuration: configuration
            }, progress);

          case 44:
            if (!debug) {
              _context.next = 47;
              break;
            }

            _context.next = 47;
            return shared.attachDebugger({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: sharedKey
            }, progress);

          case 47:
            _context.next = 49;
            return runtimes.getConnections({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              forVersion: configuration.application.runtime.version,
              persistData: persistData,
              sharedKey: sharedKey
            });

          case 49:
            connections = _context.sent;

            if (dangerouslyExposeHttpPorts && connections.api.external.http && connections.fileStorage.external.http) {
              httpPorts = [connections.api.external.http.port, connections.fileStorage.external.http.port];
              progress({
                message: "Exposed HTTP ports ".concat(arrayToSentence(httpPorts), "."),
                type: 'warn'
              });
            }

          case 51:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function reload(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = reload;