'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = require('../../../errors'),
    shell = require('../../../shell');

var cloneRepository = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options, progress) {
    var directory, template, matches, _matches, url, branch, branchOption;

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
            if (progress) {
              _context.next = 8;
              break;
            }

            throw new Error('Progress is missing.');

          case 8:
            directory = options.directory, template = options.template;
            matches = template.match(/^((?:git:|ssh:|https:\/\/|git@[\w.]+)[\w.@:/~_-]+(?:\.git)?\/?)(?:#([a-zA-Z0-9/.\-_]+))?$/);

            if (matches) {
              _context.next = 13;
              break;
            }

            progress({ message: 'Malformed url.', type: 'info' });

            throw new errors.UrlMalformed();

          case 13:
            _context.next = 15;
            return shell.which('git');

          case 15:
            if (_context.sent) {
              _context.next = 18;
              break;
            }

            progress({ message: 'git is not installed.', type: 'info' });

            throw new errors.ExecutableNotFound();

          case 18:
            _matches = (0, _slicedToArray3.default)(matches, 3), url = _matches[1], branch = _matches[2];
            branchOption = branch ? '--branch ' + branch : '';


            progress({ message: 'Cloning ' + template + '...' });

            _context.prev = 21;
            _context.next = 24;
            return shell.exec('git clone ' + branchOption + ' ' + url + ' .', { silent: true, cwd: directory });

          case 24:
            _context.next = 31;
            break;

          case 26:
            _context.prev = 26;
            _context.t0 = _context['catch'](21);

            progress({ message: '' + _context.t0.stderr });
            progress({ message: 'git failed to clone the template.', type: 'info' });

            throw _context.t0;

          case 31:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[21, 26]]);
  }));

  return function cloneRepository(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = cloneRepository;