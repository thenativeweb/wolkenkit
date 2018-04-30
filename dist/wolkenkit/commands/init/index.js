'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');

var promisify = require('util.promisify'),
    recursiveReaddirCallback = require('recursive-readdir');

var cloneRepository = require('./cloneRepository'),
    errors = require('../../../errors'),
    forceInit = require('./forceInit'),
    noop = require('../../../noop'),
    shell = require('../../../shell');

var recursiveReaddir = promisify(recursiveReaddirCallback);

var init = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var directory, template, force, files;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (options) {
              _context.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.template) {
              _context.next = 6;
              break;
            }

            throw new Error('Template is missing.');

          case 6:
            if (!(options.force === undefined)) {
              _context.next = 8;
              break;
            }

            throw new Error('Force is missing.');

          case 8:
            directory = options.directory, template = options.template, force = options.force;

            if (!force) {
              _context.next = 13;
              break;
            }

            _context.next = 12;
            return forceInit({ directory: directory, template: template }, progress);

          case 12:
            return _context.abrupt('return', _context.sent);

          case 13:
            _context.next = 15;
            return recursiveReaddir(directory);

          case 15:
            files = _context.sent;

            if (!(files.length > 0)) {
              _context.next = 19;
              break;
            }

            progress({ message: 'The current working directory is not empty.', type: 'info' });

            throw new errors.DirectoryNotEmpty();

          case 19:
            _context.next = 21;
            return cloneRepository({ directory: directory, template: template }, progress);

          case 21:
            _context.next = 23;
            return shell.rm('-rf', path.join(directory, '.git'));

          case 23:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function init(_x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = init;