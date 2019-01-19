'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../../../docker'),
    errors = require('../../../../errors'),
    health = require('../../health'),
    shared = require('../../shared');

var cli =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var configuration, directory, env, existingContainers, dangerouslyExposeHttpPorts, debug, persistData, sharedKey, applicationStatus;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, directory = _ref.directory, env = _ref.env;

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
            _context.next = 16;
            return docker.getContainers({
              configuration: configuration,
              where: {
                label: {
                  'wolkenkit-application': configuration.application.name
                }
              }
            });

          case 16:
            existingContainers = _context.sent;
            progress({
              message: 'Verifying application status...',
              type: 'info'
            }); // We can not use the application status here, because for that we need to
            // fetch the labels of the containers. So this would be a chicken-and-egg
            // problem, hence this workaround.

            if (!(existingContainers.length === 0)) {
              _context.next = 20;
              break;
            }

            throw new errors.ApplicationNotRunning();

          case 20:
            dangerouslyExposeHttpPorts = existingContainers[0].labels['wolkenkit-dangerously-expose-http-ports'] === 'true', debug = existingContainers[0].labels['wolkenkit-debug'] === 'true', persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true', sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];
            _context.next = 23;
            return shared.getApplicationStatus({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: sharedKey
            }, progress);

          case 23:
            applicationStatus = _context.sent;

            if (!(applicationStatus === 'partially-running')) {
              _context.next = 26;
              break;
            }

            throw new errors.ApplicationPartiallyRunning();

          case 26:
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