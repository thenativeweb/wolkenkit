'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../../../docker'),
    errors = require('../../../../errors'),
    health = require('../../health'),
    shared = require('../../shared'),
    start = require('../../start'),
    stop = require('../../stop');

var cli =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var configuration, directory, env, _ref$privateKey, privateKey, existingContainers, dangerouslyExposeHttpPorts, debug, persistData, port, sharedKey;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, directory = _ref.directory, env = _ref.env, _ref$privateKey = _ref.privateKey, privateKey = _ref$privateKey === void 0 ? undefined : _ref$privateKey;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (directory) {
              _context.next = 5;
              break;
            }

            throw new Error('Directory is missing.');

          case 5:
            if (env) {
              _context.next = 7;
              break;
            }

            throw new Error('Environment is missing.');

          case 7:
            if (progress) {
              _context.next = 9;
              break;
            }

            throw new Error('Progress is missing.');

          case 9:
            _context.next = 11;
            return shared.checkDocker({
              configuration: configuration
            }, progress);

          case 11:
            progress({
              message: "Verifying health on environment ".concat(env, "..."),
              type: 'info'
            });
            _context.next = 14;
            return health({
              directory: directory,
              env: env
            }, progress);

          case 14:
            progress({
              message: 'Verifying application status...',
              type: 'info'
            });
            _context.next = 17;
            return docker.getContainers({
              configuration: configuration,
              where: {
                label: {
                  'wolkenkit-application': configuration.application.name
                }
              }
            });

          case 17:
            existingContainers = _context.sent;

            if (!(existingContainers.length === 0)) {
              _context.next = 21;
              break;
            }

            progress({
              message: "The application is not running.",
              type: 'info'
            });
            throw new errors.ApplicationNotRunning();

          case 21:
            dangerouslyExposeHttpPorts = existingContainers[0].labels['wolkenkit-dangerously-expose-http-ports'] === 'true', debug = existingContainers[0].labels['wolkenkit-debug'] === 'true', persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true', port = Number(existingContainers[0].labels['wolkenkit-api-port']), sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];
            progress({
              message: "Stopping the application on environment ".concat(env, "..."),
              type: 'info'
            });
            _context.next = 25;
            return stop({
              dangerouslyDestroyData: false,
              directory: directory,
              env: env,
              port: port,
              privateKey: privateKey
            }, progress);

          case 25:
            progress({
              message: "Starting the application on environment ".concat(env, "..."),
              type: 'info'
            });
            _context.next = 28;
            return start({
              directory: directory,
              dangerouslyDestroyData: false,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              env: env,
              persist: persistData,
              port: port,
              privateKey: privateKey,
              sharedKey: sharedKey
            }, progress);

          case 28:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function cli(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = cli;