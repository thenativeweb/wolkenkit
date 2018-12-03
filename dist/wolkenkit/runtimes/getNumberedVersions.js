'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs'),
    path = require('path');

var promisify = require('util.promisify'),
    semver = require('semver');

var readdir = promisify(fs.readdir);

var getNumberedVersions =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    var entries, versions;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return readdir(path.join(__dirname, '..', '..', 'configuration'));

          case 2:
            entries = _context.sent;
            versions = entries.filter(function (version) {
              return semver.valid(version);
            }).sort(function (versionA, versionB) {
              return semver.lt(versionA, versionB);
            });
            return _context.abrupt("return", versions);

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getNumberedVersions() {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getNumberedVersions;