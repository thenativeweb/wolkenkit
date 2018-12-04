'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs'),
    path = require('path');

var promisify = require('util.promisify');

var cloneRepository = require('./cloneRepository'),
    errors = require('../../../errors'),
    forceInit = require('./forceInit'),
    noop = require('../../../noop'),
    shell = require('../../../shell');

var readdir = promisify(fs.readdir);

var init =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var progress,
        directory,
        template,
        force,
        entries,
        _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (options) {
              _context.next = 3;
              break;
            }

            throw new Error('Options are missing.');

          case 3:
            if (options.directory) {
              _context.next = 5;
              break;
            }

            throw new Error('Directory is missing.');

          case 5:
            if (options.template) {
              _context.next = 7;
              break;
            }

            throw new Error('Template is missing.');

          case 7:
            if (!(options.force === undefined)) {
              _context.next = 9;
              break;
            }

            throw new Error('Force is missing.');

          case 9:
            directory = options.directory, template = options.template, force = options.force;

            if (!force) {
              _context.next = 14;
              break;
            }

            _context.next = 13;
            return forceInit({
              directory: directory,
              template: template
            }, progress);

          case 13:
            return _context.abrupt("return", _context.sent);

          case 14:
            _context.next = 16;
            return readdir(directory);

          case 16:
            entries = _context.sent;

            if (!(entries.length > 0)) {
              _context.next = 20;
              break;
            }

            progress({
              message: 'The current working directory is not empty.',
              type: 'info'
            });
            throw new errors.DirectoryNotEmpty();

          case 20:
            _context.next = 22;
            return cloneRepository({
              directory: directory,
              template: template
            }, progress);

          case 22:
            _context.next = 24;
            return shell.rm('-rf', path.join(directory, '.git'));

          case 24:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function init(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = init;