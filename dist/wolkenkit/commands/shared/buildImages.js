'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var fs = require('fs'),
    os = require('os'),
    path = require('path');

var promisify = require('util.promisify');

var docker = require('../../../docker'),
    runtimes = require('../../runtimes'),
    shell = require('../../../shell');

var mkdtemp = promisify(fs.mkdtemp),
    writeFile = promisify(fs.writeFile);

var buildImages = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(options, progress) {
    var _this = this;

    var directory, configuration, env, name, runtime, images;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
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
            if (options.configuration) {
              _context2.next = 6;
              break;
            }

            throw new Error('Configuration is missing.');

          case 6:
            if (options.env) {
              _context2.next = 8;
              break;
            }

            throw new Error('Environment is missing.');

          case 8:
            if (progress) {
              _context2.next = 10;
              break;
            }

            throw new Error('Progress is missing.');

          case 10:
            directory = options.directory, configuration = options.configuration, env = options.env;
            name = configuration.application, runtime = configuration.runtime.version;
            _context2.next = 14;
            return runtimes.getImages({ forVersion: runtime });

          case 14:
            _context2.t0 = function (image) {
              return image.type === 'application';
            };

            images = _context2.sent.filter(_context2.t0);
            _context2.next = 18;
            return Promise.all(images.map(function () {
              var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(image) {
                var imageSuffix, tag, buildDirectory, dockerfile;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        imageSuffix = image.name.replace(/^thenativeweb\/wolkenkit-/, '');
                        tag = name + '-' + imageSuffix;
                        _context.next = 4;
                        return mkdtemp('' + os.tmpdir() + path.sep);

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
                        return writeFile(dockerfile, 'FROM ' + image.name + ':' + image.version + '\n', { encoding: 'utf8' });

                      case 12:
                        _context.next = 14;
                        return docker.buildImage({ configuration: configuration, env: env, tag: tag, directory: buildDirectory });

                      case 14:
                        progress({ message: 'Built ' + tag + '.' });

                      case 15:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this);
              }));

              return function (_x3) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 18:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function buildImages(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = buildImages;