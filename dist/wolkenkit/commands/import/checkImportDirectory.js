'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs');

var promisify = require('util.promisify');

var checkImportEventStore = require('./checkImportEventStore'),
    errors = require('../../../errors'),
    noop = require('../../../noop');

var readdir = promisify(fs.readdir);

var checkImportDirectory =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var importDirectory,
        toEventStore,
        progress,
        entries,
        _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            importDirectory = _ref.importDirectory, toEventStore = _ref.toEventStore;
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (importDirectory) {
              _context.next = 4;
              break;
            }

            throw new Error('Import directory is missing.');

          case 4:
            if (!(toEventStore === undefined)) {
              _context.next = 6;
              break;
            }

            throw new Error('To event store is missing.');

          case 6:
            if (progress) {
              _context.next = 8;
              break;
            }

            throw new Error('Progress is missing.');

          case 8:
            _context.next = 10;
            return readdir(importDirectory);

          case 10:
            entries = _context.sent;

            if (!(entries.length === 0)) {
              _context.next = 14;
              break;
            }

            progress({
              message: 'The import directory must not be empty.',
              type: 'info'
            });
            throw new errors.DirectoryEmpty();

          case 14:
            if (!toEventStore) {
              _context.next = 17;
              break;
            }

            _context.next = 17;
            return checkImportEventStore({
              importDirectory: importDirectory
            }, progress);

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function checkImportDirectory(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = checkImportDirectory;