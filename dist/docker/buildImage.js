'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var buildImage =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, directory, tag, environmentVariables;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, directory = _ref.directory, tag = _ref.tag;

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
            if (tag) {
              _context.next = 7;
              break;
            }

            throw new Error('Tag is missing.');

          case 7:
            _context.next = 9;
            return getEnvironmentVariables({
              configuration: configuration
            });

          case 9:
            environmentVariables = _context.sent;
            _context.next = 12;
            return shell.exec("docker build -t ".concat(tag, " ").concat(directory), {
              env: environmentVariables
            });

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function buildImage(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = buildImage;