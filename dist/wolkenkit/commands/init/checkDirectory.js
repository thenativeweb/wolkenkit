'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs');

var promisify = require('util.promisify');

var errors = require('../../../errors');

var readdir = promisify(fs.readdir);

var checkDirectory =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var directory, force, entries;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = _ref.directory, force = _ref.force;

            if (directory) {
              _context.next = 3;
              break;
            }

            throw new Error('Directory is missing.');

          case 3:
            if (!(force === undefined)) {
              _context.next = 5;
              break;
            }

            throw new Error('Force is missing.');

          case 5:
            if (progress) {
              _context.next = 7;
              break;
            }

            throw new Error('Progress is missing.');

          case 7:
            if (!force) {
              _context.next = 9;
              break;
            }

            return _context.abrupt("return");

          case 9:
            _context.next = 11;
            return readdir(directory);

          case 11:
            entries = _context.sent;

            if (!(entries.length > 0)) {
              _context.next = 15;
              break;
            }

            progress({
              message: 'The current working directory is not empty.',
              type: 'info'
            });
            throw new errors.DirectoryNotEmpty();

          case 15:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function checkDirectory(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = checkDirectory;