'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var path = require('path');

var isolated = require('isolated'),
    promisify = require('util.promisify'),
    recursiveReaddirCallback = require('recursive-readdir');

var cloneRepository = require('./cloneRepository'),
    shell = require('../../../shell');

var recursiveReaddir = promisify(recursiveReaddirCallback);

var forceInit =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, progress) {
    var directory, template, tempDirectory, clonedFiles, files, _loop, i;

    return _regenerator.default.wrap(function _callee$(_context2) {
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
            return isolated();

          case 11:
            tempDirectory = _context2.sent;
            _context2.next = 14;
            return cloneRepository({
              directory: tempDirectory,
              template: template
            }, progress);

          case 14:
            _context2.next = 16;
            return recursiveReaddir(tempDirectory, ['.git']);

          case 16:
            clonedFiles = _context2.sent;
            _context2.next = 19;
            return recursiveReaddir(directory, ['.git']);

          case 19:
            files = _context2.sent;
            _loop =
            /*#__PURE__*/
            _regenerator.default.mark(function _loop(i) {
              var clonedFile, clonedFileName, file, targetFile;
              return _regenerator.default.wrap(function _loop$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      clonedFile = clonedFiles[i], clonedFileName = clonedFile.replace("".concat(tempDirectory).concat(path.sep), '');
                      file = files.find(function (filePath) {
                        var fileName = filePath.replace("".concat(directory).concat(path.sep), '');
                        return clonedFileName === fileName;
                      });

                      if (!file) {
                        _context.next = 6;
                        break;
                      }

                      progress({
                        message: "Creating backup file for ".concat(clonedFileName, "...")
                      });
                      _context.next = 6;
                      return shell.mv('-f', file, "".concat(file, ".bak"));

                    case 6:
                      targetFile = path.join(directory, clonedFileName);
                      _context.next = 9;
                      return shell.mkdir('-p', path.dirname(targetFile));

                    case 9:
                      _context.next = 11;
                      return shell.mv('-f', clonedFile, targetFile);

                    case 11:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _loop, this);
            });
            i = 0;

          case 22:
            if (!(i < clonedFiles.length)) {
              _context2.next = 27;
              break;
            }

            return _context2.delegateYield(_loop(i), "t0", 24);

          case 24:
            i++;
            _context2.next = 22;
            break;

          case 27:
            _context2.next = 29;
            return shell.rm('-rf', tempDirectory);

          case 29:
          case "end":
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