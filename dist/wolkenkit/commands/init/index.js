'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var fs = require('fs'),
    path = require('path');

var promisify = require('util.promisify');

var errors = require('../../../errors'),
    noop = require('../../../noop'),
    shell = require('../../../shell');

var readdir = promisify(fs.readdir);

var init = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;

    var directory, template, matches, _matches, url, branch, entries, branchOption;

    return regeneratorRuntime.wrap(function _callee$(_context) {
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
            directory = options.directory, template = options.template;
            matches = template.match(/^((?:git:|ssh:|https:\/\/|git@[\w.]+)[\w.@:/~_-]+(?:\.git)?\/?)(?:#([a-zA-Z0-9/.\-_]+))?$/);

            if (matches) {
              _context.next = 11;
              break;
            }

            progress({ message: 'Malformed url.', type: 'info' });

            throw new errors.UrlMalformed();

          case 11:
            _matches = _slicedToArray(matches, 3), url = _matches[1], branch = _matches[2];
            _context.next = 14;
            return readdir(directory);

          case 14:
            entries = _context.sent;

            if (!(entries.length > 0)) {
              _context.next = 18;
              break;
            }

            progress({ message: 'The current working directory is not empty.', type: 'info' });

            throw new errors.DirectoryNotEmpty();

          case 18:
            _context.next = 20;
            return shell.which('git');

          case 20:
            if (_context.sent) {
              _context.next = 23;
              break;
            }

            progress({ message: 'git is not installed.', type: 'info' });

            throw new errors.ExecutableNotFound();

          case 23:

            progress({ message: 'Cloning ' + template + '...' });

            branchOption = branch ? '--branch ' + branch : '';
            _context.prev = 25;
            _context.next = 28;
            return shell.exec('git clone ' + branchOption + ' ' + url + ' .', { silent: true, cwd: directory });

          case 28:
            _context.next = 35;
            break;

          case 30:
            _context.prev = 30;
            _context.t0 = _context['catch'](25);

            progress({ message: '' + _context.t0.stderr });
            progress({ message: 'git failed to clone the template.', type: 'info' });

            throw _context.t0;

          case 35:
            _context.next = 37;
            return shell.rm('-rf', path.join(directory, '.git'));

          case 37:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[25, 30]]);
  }));

  return function init(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = init;