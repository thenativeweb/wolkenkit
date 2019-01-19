'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs'),
    os = require('os'),
    path = require('path');

var promisify = require('util.promisify');

var docker = require('../../../docker'),
    runtimes = require('../../runtimes'),
    shell = require('../../../shell');

var mkdtemp = promisify(fs.mkdtemp),
    writeFile = promisify(fs.writeFile);

var buildImages =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(_ref, progress) {
    var configuration, directory, applicationName, runtimeVersion, images;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            configuration = _ref.configuration, directory = _ref.directory;

            if (configuration) {
              _context2.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (directory) {
              _context2.next = 5;
              break;
            }

            throw new Error('Directory is missing.');

          case 5:
            if (progress) {
              _context2.next = 7;
              break;
            }

            throw new Error('Progress is missing.');

          case 7:
            applicationName = configuration.application.name, runtimeVersion = configuration.application.runtime.version;
            _context2.next = 10;
            return runtimes.getImages({
              forVersion: runtimeVersion
            });

          case 10:
            images = _context2.sent;
            _context2.next = 13;
            return Promise.all(images.map(
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(image) {
                var imageSuffix, tag, buildDirectory, dockerfile;
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        imageSuffix = image.name.replace(/^thenativeweb\/wolkenkit-/, '');
                        tag = "".concat(applicationName, "-").concat(imageSuffix);
                        _context.next = 4;
                        return mkdtemp("".concat(os.tmpdir()).concat(path.sep));

                      case 4:
                        buildDirectory = _context.sent;
                        dockerfile = path.join(buildDirectory, 'Dockerfile');
                        _context.next = 8;
                        return shell.cp('-R', path.join(directory, 'package.json'), buildDirectory);

                      case 8:
                        _context.next = 10;
                        return shell.cp('-R', path.join(directory, 'server'), buildDirectory);

                      case 10:
                        _context.next = 12;
                        return writeFile(dockerfile, "FROM ".concat(image.name, ":").concat(image.version, "\n"), {
                          encoding: 'utf8'
                        });

                      case 12:
                        _context.next = 14;
                        return docker.buildImage({
                          configuration: configuration,
                          directory: buildDirectory,
                          tag: tag
                        });

                      case 14:
                        progress({
                          message: "Built ".concat(tag, ".")
                        });

                      case 15:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x3) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 13:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function buildImages(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = buildImages;