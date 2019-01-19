'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var removeContainer =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, container, environmentVariables;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, container = _ref.container;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (container) {
              _context.next = 5;
              break;
            }

            throw new Error('Container is missing.');

          case 5:
            _context.next = 7;
            return getEnvironmentVariables({
              configuration: configuration
            });

          case 7:
            environmentVariables = _context.sent;
            _context.next = 10;
            return shell.exec("docker rm --force --volumes \"".concat(container.name, "\""), {
              env: environmentVariables
            });

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function removeContainer(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = removeContainer;