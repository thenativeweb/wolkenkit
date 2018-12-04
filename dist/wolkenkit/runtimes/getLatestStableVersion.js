'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var semver = require('semver');

var getNumberedVersions = require('./getNumberedVersions');

var getLatestStableVersion =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    var latestStableVersion, versions;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            latestStableVersion = '0.0.0';
            _context.next = 3;
            return getNumberedVersions();

          case 3:
            versions = _context.sent;
            versions.forEach(function (version) {
              if (!semver.valid(version)) {
                return;
              }

              if (!semver.gt(version, latestStableVersion)) {
                return;
              }

              latestStableVersion = version;
            });
            return _context.abrupt("return", latestStableVersion);

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getLatestStableVersion() {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getLatestStableVersion;