'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var removeNetwork =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, name, environmentVariables;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            name = "".concat(configuration.application.name, "-network");
            _context.next = 6;
            return getEnvironmentVariables({
              configuration: configuration
            });

          case 6:
            environmentVariables = _context.sent;
            _context.next = 9;
            return shell.exec("docker network rm \"".concat(name, "\""), {
              env: environmentVariables
            });

          case 9:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function removeNetwork(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = removeNetwork;