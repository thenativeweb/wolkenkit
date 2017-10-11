'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    noop = require('../../../noop'),
    runtimes = require('../../runtimes'),
    shared = require('../shared');

var install = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(options) {
    var _this = this;

    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var directory, env, version, configuration, images, installationStatus;
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
            if (options.env) {
              _context2.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (options.version) {
              _context2.next = 8;
              break;
            }

            throw new Error('Version is missing.');

          case 8:
            directory = options.directory, env = options.env, version = options.version;
            _context2.next = 11;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: false
            }, progress);

          case 11:
            configuration = _context2.sent;
            _context2.next = 14;
            return shared.checkDocker({ configuration: configuration, env: env }, progress);

          case 14:
            images = void 0;
            _context2.prev = 15;
            _context2.next = 18;
            return runtimes.getImages({ forVersion: version });

          case 18:
            images = _context2.sent;
            _context2.next = 30;
            break;

          case 21:
            _context2.prev = 21;
            _context2.t0 = _context2['catch'](15);
            _context2.t1 = _context2.t0.code;
            _context2.next = _context2.t1 === 'EVERSIONNOTFOUND' ? 26 : 28;
            break;

          case 26:
            progress({ message: 'Version does not exist.', type: 'info' });
            return _context2.abrupt('break', 29);

          case 28:
            progress({ message: _context2.t0.message, type: 'info' });

          case 29:
            throw _context2.t0;

          case 30:
            _context2.next = 32;
            return runtimes.getInstallationStatus({ configuration: configuration, env: env, forVersion: version });

          case 32:
            installationStatus = _context2.sent;

            if (!(installationStatus === 'installed')) {
              _context2.next = 36;
              break;
            }

            progress({ message: 'wolkenkit ' + version + ' is already installed.', type: 'info' });

            throw new errors.RuntimeAlreadyInstalled();

          case 36:
            _context2.next = 38;
            return Promise.all(images.map(function () {
              var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(image) {
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        progress({ message: 'Pulling ' + image.name + ':' + image.version + '...' });

                        _context.prev = 1;
                        _context.next = 4;
                        return docker.pullImage({ configuration: configuration, env: env, name: image.name, version: image.version });

                      case 4:
                        _context.next = 10;
                        break;

                      case 6:
                        _context.prev = 6;
                        _context.t0 = _context['catch'](1);

                        progress({ message: 'Failed to pull ' + image.name + ':' + image.version + '.', type: 'info' });

                        throw _context.t0;

                      case 10:

                        progress({ message: 'Pulled ' + image.name + ':' + image.version + '.', type: 'info' });

                      case 11:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this, [[1, 6]]);
              }));

              return function (_x3) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 38:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[15, 21]]);
  }));

  return function install(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = install;