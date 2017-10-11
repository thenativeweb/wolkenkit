'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var semver = require('semver');

var getNumberedVersions = require('./getNumberedVersions');

var getLatestStableVersion = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var latestStableVersion, versions;
    return regeneratorRuntime.wrap(function _callee$(_context) {
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