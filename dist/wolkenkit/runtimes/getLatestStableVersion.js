'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var semver = require('semver');

var getNumberedVersions = require('./getNumberedVersions');

var getLatestStableVersion = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
    var latestStableVersion, versions;
    return _regenerator2.default.wrap(function _callee$(_context) {
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

            return _context.abrupt('return', latestStableVersion);

          case 6:
          case 'end':
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