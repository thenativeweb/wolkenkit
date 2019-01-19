'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var arrayToSentence = require('array-to-sentence'),
    processenv = require('processenv');

var docker = require('../../../../docker'),
    errors = require('../../../../errors'),
    generateSharedKey = require('./generateSharedKey'),
    health = require('../../health'),
    install = require('../../install'),
    noop = require('../../../../noop'),
    runtimes = require('../../../runtimes'),
    shared = require('../../shared'),
    startContainers = require('./startContainers'),
    stop = require('../../stop'),
    verifyThatPortsAreAvailable = require('./verifyThatPortsAreAvailable');

var cli =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var configuration, dangerouslyDestroyData, dangerouslyExposeHttpPorts, debug, directory, env, persist, port, privateKey, sharedKey, sharedKeyByUser, isSharedKeyGivenByUser, actualSharedKey, persistData, applicationStatus, runtimeVersion, connections, httpPorts;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, dangerouslyDestroyData = _ref.dangerouslyDestroyData, dangerouslyExposeHttpPorts = _ref.dangerouslyExposeHttpPorts, debug = _ref.debug, directory = _ref.directory, env = _ref.env, persist = _ref.persist, port = _ref.port, privateKey = _ref.privateKey, sharedKey = _ref.sharedKey;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (!(dangerouslyDestroyData === undefined)) {
              _context.next = 5;
              break;
            }

            throw new Error('Dangerously destroy data is missing.');

          case 5:
            if (!(dangerouslyExposeHttpPorts === undefined)) {
              _context.next = 7;
              break;
            }

            throw new Error('Dangerously expose http ports is missing.');

          case 7:
            if (!(debug === undefined)) {
              _context.next = 9;
              break;
            }

            throw new Error('Debug is missing.');

          case 9:
            if (directory) {
              _context.next = 11;
              break;
            }

            throw new Error('Directory is missing.');

          case 11:
            if (env) {
              _context.next = 13;
              break;
            }

            throw new Error('Environment is missing.');

          case 13:
            if (!(persist === undefined)) {
              _context.next = 15;
              break;
            }

            throw new Error('Persist is missing.');

          case 15:
            if (progress) {
              _context.next = 17;
              break;
            }

            throw new Error('Progress is missing.');

          case 17:
            sharedKeyByUser = sharedKey || processenv('WOLKENKIT_SHARED_KEY');
            isSharedKeyGivenByUser = Boolean(sharedKeyByUser);

            if (!(persist && !isSharedKeyGivenByUser)) {
              _context.next = 22;
              break;
            }

            progress({
              message: 'Shared key must be set when enabling persistence.',
              type: 'info'
            });
            throw new errors.SharedKeyMissing();

          case 22:
            _context.t0 = sharedKeyByUser;

            if (_context.t0) {
              _context.next = 27;
              break;
            }

            _context.next = 26;
            return generateSharedKey();

          case 26:
            _context.t0 = _context.sent;

          case 27:
            actualSharedKey = _context.t0;
            persistData = persist;
            _context.next = 31;
            return shared.checkDocker({
              configuration: configuration
            }, progress);

          case 31:
            progress({
              message: "Verifying health on environment ".concat(env, "..."),
              type: 'info'
            });
            _context.next = 34;
            return health({
              directory: directory,
              env: env
            }, progress);

          case 34:
            progress({
              message: 'Verifying application status...',
              type: 'info'
            });
            _context.next = 37;
            return shared.getApplicationStatus({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: actualSharedKey
            }, progress);

          case 37:
            applicationStatus = _context.sent;

            if (!(applicationStatus === 'running')) {
              _context.next = 41;
              break;
            }

            progress({
              message: "The application is already running.",
              type: 'info'
            });
            throw new errors.ApplicationAlreadyRunning();

          case 41:
            if (!(applicationStatus === 'partially-running')) {
              _context.next = 44;
              break;
            }

            progress({
              message: "The application is partially running.",
              type: 'info'
            });
            throw new errors.ApplicationPartiallyRunning();

          case 44:
            progress({
              message: 'Verifying that ports are available...',
              type: 'info'
            });
            _context.next = 47;
            return verifyThatPortsAreAvailable({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: actualSharedKey
            }, progress);

          case 47:
            runtimeVersion = configuration.application.runtime.version;
            _context.next = 50;
            return runtimes.getInstallationStatus({
              configuration: configuration,
              forVersion: runtimeVersion
            });

          case 50:
            _context.t1 = _context.sent;

            if (!(_context.t1 !== 'installed')) {
              _context.next = 55;
              break;
            }

            progress({
              message: "Installing wolkenkit ".concat(runtimeVersion, " on environment ").concat(env, "..."),
              type: 'info'
            });
            _context.next = 55;
            return install({
              directory: directory,
              env: env,
              version: runtimeVersion
            }, progress);

          case 55:
            if (!dangerouslyDestroyData) {
              _context.next = 60;
              break;
            }

            progress({
              message: 'Destroying previous data...',
              type: 'verbose'
            });
            _context.next = 59;
            return shared.destroyData({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: actualSharedKey
            }, progress);

          case 59:
            progress({
              message: 'Destroyed previous data.',
              type: 'warn'
            });

          case 60:
            progress({
              message: 'Setting up network...',
              type: 'info'
            });
            _context.next = 63;
            return docker.ensureNetworkExists({
              configuration: configuration
            });

          case 63:
            progress({
              message: 'Building Docker images...',
              type: 'info'
            });
            _context.next = 66;
            return shared.buildImages({
              configuration: configuration,
              directory: directory
            }, progress);

          case 66:
            progress({
              message: 'Starting Docker containers...',
              type: 'info'
            });
            _context.next = 69;
            return startContainers({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: actualSharedKey
            }, progress);

          case 69:
            progress({
              message: "Using ".concat(actualSharedKey, " as shared key."),
              type: 'info'
            });
            _context.prev = 70;
            _context.next = 73;
            return shared.waitForApplicationAndValidateLogs({
              configuration: configuration
            }, progress);

          case 73:
            _context.next = 85;
            break;

          case 75:
            _context.prev = 75;
            _context.t2 = _context["catch"](70);
            _context.t3 = _context.t2.code;
            _context.next = _context.t3 === 'ERUNTIMEERROR' ? 80 : 83;
            break;

          case 80:
            _context.next = 82;
            return stop({
              dangerouslyDestroyData: false,
              directory: directory,
              env: env,
              privateKey: privateKey,
              port: port
            }, noop);

          case 82:
            return _context.abrupt("break", 84);

          case 83:
            return _context.abrupt("break", 84);

          case 84:
            throw _context.t2;

          case 85:
            if (!debug) {
              _context.next = 88;
              break;
            }

            _context.next = 88;
            return shared.attachDebugger({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: actualSharedKey
            }, progress);

          case 88:
            _context.next = 90;
            return runtimes.getConnections({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              forVersion: configuration.application.runtime.version,
              persistData: persistData,
              sharedKey: actualSharedKey
            });

          case 90:
            connections = _context.sent;

            if (dangerouslyExposeHttpPorts && connections.api.external.http && connections.fileStorage.external.http) {
              httpPorts = [connections.api.external.http.port, connections.fileStorage.external.http.port];
              progress({
                message: "Exposed HTTP ports ".concat(arrayToSentence(httpPorts), "."),
                type: 'warn'
              });
            }

          case 92:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[70, 75]]);
  }));

  return function cli(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = cli;