'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');

var isolated = require('isolated'),
    promisify = require('util.promisify'),
    recursiveReaddirCallback = require('recursive-readdir');

var cloneRepository = require('./cloneRepository'),
    shell = require('../../../shell');

var isolatedAsync = promisify(isolated),
    recursiveReaddir = promisify(recursiveReaddirCallback);

var forceInit = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options, progress) {
    var _this = this;

    var directory, template, tempDirectory, clonedFiles, files, _loop, i;

    return _regenerator2.default.wrap(function _callee$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (options) {
              _context2.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.directory) {
              _context2.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.template) {
              _context2.next = 6;
              break;
            }

            throw new Error('Template is missing.');

          case 6:
            if (progress) {
              _context2.next = 8;
              break;
            }

            throw new Error('Progress is missing.');

          case 8:
            directory = options.directory, template = options.template;
            _context2.next = 11;
            return isolatedAsync();

          case 11:
            tempDirectory = _context2.sent;
            _context2.next = 14;
            return cloneRepository({ directory: tempDirectory, template: template }, progress);

          case 14:
            _context2.next = 16;
            return recursiveReaddir(tempDirectory, ['.git']);

          case 16:
            clonedFiles = _context2.sent;
            _context2.next = 19;
            return recursiveReaddir(directory, ['.git']);

          case 19:
            files = _context2.sent;
            _loop = /*#__PURE__*/_regenerator2.default.mark(function _loop(i) {
              var clonedFile, clonedFileName, file, targetFile;
              return _regenerator2.default.wrap(function _loop$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      clonedFile = clonedFiles[i], clonedFileName = clonedFile.replace('' + tempDirectory + path.sep, '');
                      file = files.find(function (filePath) {
                        var fileName = filePath.replace('' + directory + path.sep, '');

                        return clonedFileName === fileName;
                      });

                      if (!file) {
                        _context.next = 6;
                        break;
                      }

                      progress({ message: 'Creating backup file for ' + clonedFileName + '...' });
                      _context.next = 6;
                      return shell.mv('-f', file, file + '.bak');

                    case 6:
                      targetFile = path.join(directory, clonedFileName);
                      _context.next = 9;
                      return shell.mkdir('-p', path.dirname(targetFile));

                    case 9:
                      _context.next = 11;
                      return shell.mv('-f', clonedFile, targetFile);

                    case 11:
                    case 'end':
                      return _context.stop();
                  }
                }
              }, _loop, _this);
            });
            i = 0;

          case 22:
            if (!(i < clonedFiles.length)) {
              _context2.next = 27;
              break;
            }

            return _context2.delegateYield(_loop(i), 't0', 24);

          case 24:
            i++;
            _context2.next = 22;
            break;

          case 27:
            _context2.next = 29;
            return shell.rm('-rf', tempDirectory);

          case 29:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee, this);
  }));

  return function forceInit(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = forceInit;