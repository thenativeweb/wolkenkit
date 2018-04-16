'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var shell = require('../shell');

var getLatestPackageVersion = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(name) {
    var output, latestPackageVersion;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (name) {
              _context.next = 2;
              break;
            }

            throw new Error('Name is missing.');

          case 2:
            _context.next = 4;
            return shell.exec('npm view ' + name + ' version', { silent: true });

          case 4:
            output = _context.sent;
            latestPackageVersion = output.stdout.replace(/(\r\n|\n|\r)/gm, '');
            return _context.abrupt('return', latestPackageVersion);

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getLatestPackageVersion(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getLatestPackageVersion;