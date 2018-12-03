'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    health = require('../health'),
    noop = require('../../../noop'),
    shared = require('../shared');

var logs =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var progress,
        directory,
        env,
        follow,
        configuration,
        containers,
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
            if (!(options.follow === undefined)) {
              _context.next = 9;
              break;
            }

            throw new Error('Follow is missing.');

          case 9:
            directory = options.directory, env = options.env, follow = options.follow;
            _context.next = 12;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: true
            }, progress);

          case 12:
            configuration = _context.sent;
            _context.next = 15;
            return shared.checkDocker({
              configuration: configuration,
              env: env
            }, progress);

          case 15:
            progress({
              message: "Verifying health on environment ".concat(env, "...")
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
                  'wolkenkit-application': configuration.application,
                  'wolkenkit-type': 'application'
                }
              }
            });

          case 20:
            containers = _context.sent;

            if (!(containers.length === 0)) {
              _context.next = 24;
              break;
            }

            progress({
              message: "The application is not running.",
              type: 'info'
            });
            throw new errors.ApplicationNotRunning();

          case 24:
            _context.next = 26;
            return docker.logs({
              configuration: configuration,
              containers: containers,
              env: env,
              follow: follow
            });

          case 26:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function logs(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = logs;