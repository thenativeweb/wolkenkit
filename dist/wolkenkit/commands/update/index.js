'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var semver = require('semver');

var errors = require('../../../errors'),
    noop = require('../../../noop'),
    npm = require('../../../npm');

var update = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
    var progress = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : noop;
    var packageName, installedVersion, latestVersion;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            packageName = 'wolkenkit';
            _context.next = 3;
            return npm.getInstalledPackageVersion(packageName);

          case 3:
            installedVersion = _context.sent;
            _context.next = 6;
            return npm.getLatestPackageVersion(packageName);

          case 6:
            latestVersion = _context.sent;

            if (!semver.eq(installedVersion, latestVersion)) {
              _context.next = 9;
              break;
            }

            throw new errors.VersionAlreadyInstalled();

          case 9:

            progress({ message: 'Updating to version ' + latestVersion + '...', type: 'info' });

            _context.prev = 10;
            _context.next = 13;
            return npm.installPackage(packageName, latestVersion);

          case 13:
            _context.next = 20;
            break;

          case 15:
            _context.prev = 15;
            _context.t0 = _context['catch'](10);

            progress({ message: 'npm failed to install.', type: 'info' });
            progress({ message: _context.t0.stderr || _context.t0.stdout });

            throw _context.t0;

          case 20:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[10, 15]]);
  }));

  return function update() {
    return _ref.apply(this, arguments);
  };
}();

module.exports = update;