'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var path = require('path');

var checkDirectory = require('./checkDirectory'),
    cloneRepository = require('./cloneRepository'),
    forceInit = require('./forceInit'),
    noop = require('../../../noop'),
    shell = require('../../../shell');

var init =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var directory,
        force,
        template,
        progress,
        _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = _ref.directory, force = _ref.force, template = _ref.template;
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (!(force === undefined)) {
              _context.next = 6;
              break;
            }

            throw new Error('Force is missing.');

          case 6:
            if (template) {
              _context.next = 8;
              break;
            }

            throw new Error('Template is missing.');

          case 8:
            if (!force) {
              _context.next = 12;
              break;
            }

            _context.next = 11;
            return forceInit({
              directory: directory,
              template: template
            }, progress);

          case 11:
            return _context.abrupt("return", _context.sent);

          case 12:
            _context.next = 14;
            return checkDirectory({
              directory: directory,
              force: force
            }, progress);

          case 14:
            _context.next = 16;
            return cloneRepository({
              directory: directory,
              template: template
            }, progress);

          case 16:
            _context.next = 18;
            return shell.rm('-rf', path.join(directory, '.git'));

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function init(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = init;