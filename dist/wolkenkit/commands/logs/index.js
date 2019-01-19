'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    health = require('../health'),
    shared = require('../shared');

var logs =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var directory, env, follow, configuration, containers;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = _ref.directory, env = _ref.env, follow = _ref.follow;

            if (directory) {
              _context.next = 3;
              break;
            }

            throw new Error('Directory is missing.');

          case 3:
            if (env) {
              _context.next = 5;
              break;
            }

            throw new Error('Environment is missing.');

          case 5:
            if (!(follow === undefined)) {
              _context.next = 7;
              break;
            }

            throw new Error('Follow is missing.');

          case 7:
            if (progress) {
              _context.next = 9;
              break;
            }

            throw new Error('Progress is missing.');

          case 9:
            _context.next = 11;
            return shared.getConfiguration({
              directory: directory,
              env: env,
              isPackageJsonRequired: true
            }, progress);

          case 11:
            configuration = _context.sent;
            _context.next = 14;
            return shared.checkDocker({
              configuration: configuration
            }, progress);

          case 14:
            progress({
              message: "Verifying health on environment ".concat(env, "...")
            });
            _context.next = 17;
            return health({
              directory: directory,
              env: env
            }, progress);

          case 17:
            _context.next = 19;
            return docker.getContainers({
              configuration: configuration,
              where: {
                label: {
                  'wolkenkit-application': configuration.application.name,
                  'wolkenkit-type': 'application'
                }
              }
            });

          case 19:
            containers = _context.sent;

            if (!(containers.length === 0)) {
              _context.next = 23;
              break;
            }

            progress({
              message: "The application is not running.",
              type: 'info'
            });
            throw new errors.ApplicationNotRunning();

          case 23:
            _context.next = 25;
            return docker.logs({
              configuration: configuration,
              containers: containers,
              follow: follow
            });

          case 25:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function logs(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = logs;