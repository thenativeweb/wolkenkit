'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = require('../errors'),
    shell = require('../shell');

var getInstalledPackageVersion = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(name) {
    var installedVersion, output, regExp, matches;
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
            installedVersion = '0.0.0', output = void 0;
            _context.prev = 3;
            _context.next = 6;
            return shell.exec('npm list -g ' + name, { silent: true });

          case 6:
            output = _context.sent;
            _context.next = 12;
            break;

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](3);
            return _context.abrupt('return', installedVersion);

          case 12:
            regExp = new RegExp(name + '@(.*?)\\s', 'gm');
            matches = regExp.exec(output.stdout);

            if (matches) {
              _context.next = 16;
              break;
            }

            throw new errors.OutputMalformed();

          case 16:

            installedVersion = matches[1];

            return _context.abrupt('return', installedVersion);

          case 18:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[3, 9]]);
  }));

  return function getInstalledPackageVersion(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getInstalledPackageVersion;