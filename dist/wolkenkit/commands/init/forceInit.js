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
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var directory, template, tempDirectory, clonedFiles, files, _loop, i;

    return _regenerator.default.wrap(function _callee$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            directory = _ref.directory, template = _ref.template;

            if (directory) {
              _context2.next = 3;
              break;
            }

            throw new Error('Directory is missing.');

          case 3:
            if (template) {
              _context2.next = 5;
              break;
            }

            throw new Error('Template is missing.');

          case 5:
            if (progress) {
              _context2.next = 7;
              break;
            }

            throw new Error('Progress is missing.');

          case 7:
            _context2.next = 9;
            return isolated();

          case 9:
            tempDirectory = _context2.sent;
            _context2.next = 12;
            return cloneRepository({
              directory: tempDirectory,
              template: template
            }, progress);

          case 12:
            _context2.next = 14;
            return recursiveReaddir(tempDirectory, ['.git']);

          case 14:
            clonedFiles = _context2.sent;
            _context2.next = 17;
            return recursiveReaddir(directory, ['.git']);

          case 17:
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

          case 20:
            if (!(i < clonedFiles.length)) {
              _context2.next = 25;
              break;
            }

            return _context2.delegateYield(_loop(i), "t0", 22);

          case 22:
            i++;
            _context2.next = 20;
            break;

          case 25:
            _context2.next = 27;
            return shell.rm('-rf', tempDirectory);

          case 27:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee, this);
  }));

  return function forceInit(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = forceInit;