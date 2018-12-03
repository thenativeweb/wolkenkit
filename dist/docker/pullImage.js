'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var pullImage =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var configuration, env, name, version, environmentVariables;
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
            if (options.configuration) {
              _context.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (options.name) {
              _context.next = 8;
              break;
            }

            throw new Error('Name is missing.');

          case 8:
            if (options.version) {
              _context.next = 10;
              break;
            }

            throw new Error('Version is missing.');

          case 10:
            configuration = options.configuration, env = options.env, name = options.name, version = options.version;
            _context.next = 13;
            return getEnvironmentVariables({
              configuration: configuration,
              env: env
            });

          case 13:
            environmentVariables = _context.sent;
            _context.next = 16;
            return shell.exec("docker pull ".concat(name, ":").concat(version), {
              env: environmentVariables
            });

          case 16:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function pullImage(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = pullImage;