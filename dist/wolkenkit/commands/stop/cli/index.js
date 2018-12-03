'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../../../docker'),
    errors = require('../../../../errors'),
    health = require('../../health'),
    removeContainers = require('./removeContainers'),
    shared = require('../../shared');

var cli =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, progress) {
    var directory, dangerouslyDestroyData, env, configuration, existingContainers, debug, persistData, sharedKey, applicationStatus;
    return _regenerator.default.wrap(function _callee$(_context) {
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
            if (options.configuration) {
              _context.next = 10;
              break;
            }

            throw new Error('Configuration is missing.');

          case 10:
            if (progress) {
              _context.next = 12;
              break;
            }

            throw new Error('Progress is missing.');

          case 12:
            directory = options.directory, dangerouslyDestroyData = options.dangerouslyDestroyData, env = options.env, configuration = options.configuration;
            _context.next = 15;
            return shared.checkDocker({
              configuration: configuration,
              env: env
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
            _context.next = 20;
            return docker.getContainers({
              configuration: configuration,
              env: env,
              where: {
                label: {
                  'wolkenkit-application': configuration.application
                }
              }
            });

          case 20:
            existingContainers = _context.sent;
            progress({
              message: 'Verifying application status...',
              type: 'info'
            }); // We can not use the application status here, because for that we need to
            // fetch the labels of the containers. So this would be a chicken-and-egg
            // problem, hence this workaround.

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
            debug = existingContainers[0].labels['wolkenkit-debug'] === 'true', persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true', sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];
            _context.next = 28;
            return shared.getApplicationStatus({
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            }, progress);

          case 28:
            applicationStatus = _context.sent;

            if (applicationStatus === 'partially-running') {
              progress({
                message: "The application is partially running.",
                type: 'info'
              });
            }

            progress({
              message: "Removing Docker containers...",
              type: 'info'
            });
            _context.next = 33;
            return removeContainers({
              configuration: configuration,
              env: env
            }, progress);

          case 33:
            progress({
              message: "Removing network...",
              type: 'info'
            });
            _context.next = 36;
            return docker.removeNetwork({
              configuration: configuration,
              env: env
            });

          case 36:
            if (!dangerouslyDestroyData) {
              _context.next = 40;
              break;
            }

            progress({
              message: 'Destroying previous data...',
              type: 'info'
            });
            _context.next = 40;
            return shared.destroyData({
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            }, progress);

          case 40:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function cli(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = cli;