'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var fs = require('fs'),
    path = require('path');

var promisify = require('util.promisify'),
    semver = require('semver');

var readdir = promisify(fs.readdir);

var getNumberedVersions = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var entries, versions;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return readdir(path.join(__dirname, '..', '..', '..', 'configuration'));

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