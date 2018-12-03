'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var getLatestVersion = require('./getLatestVersion'),
    getNumberedVersions = require('./getNumberedVersions');

var getAllVersions =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    var latestVersion, numberedVersions, versions;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return getLatestVersion();

          case 2:
            latestVersion = _context.sent;
            _context.next = 5;
            return getNumberedVersions();

          case 5:
            numberedVersions = _context.sent;
            versions = [latestVersion].concat((0, _toConsumableArray2.default)(numberedVersions));
            return _context.abrupt("return", versions);

          case 8:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getAllVersions() {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getAllVersions;