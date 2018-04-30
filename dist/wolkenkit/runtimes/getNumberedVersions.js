'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs'),
    path = require('path');

var promisify = require('util.promisify'),
    semver = require('semver');

var readdir = promisify(fs.readdir);

var getNumberedVersions = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
    var entries, versions;
    return _regenerator2.default.wrap(function _callee$(_context) {
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
            return _context.abrupt('return', versions);

          case 5:
          case 'end':
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