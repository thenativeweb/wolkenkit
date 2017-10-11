'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var application = require('../../../application'),
    errors = require('../../../errors'),
    runtimes = require('../../runtimes');

var getFallbackConfiguration = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return runtimes.getLatestStableVersion();

          case 2:
            _context.t0 = _context.sent;
            _context.t1 = {
              version: _context.t0
            };
            _context.t2 = {
              default: {}
            };
            return _context.abrupt('return', {
              runtime: _context.t1,
              environments: _context.t2
            });

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getFallbackConfiguration() {
    return _ref.apply(this, arguments);
  };
}();

var getConfiguration = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(options, progress) {
    var env, directory, isPackageJsonRequired, configuration;
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
            if (!(options.isPackageJsonRequired === undefined)) {
              _context2.next = 8;
              break;
            }

            throw new Error('Is package.json required is missing.');

          case 8:
            if (progress) {
              _context2.next = 10;
              break;
            }

            throw new Error('Progress is missing.');

          case 10:
            env = options.env, directory = options.directory, isPackageJsonRequired = options.isPackageJsonRequired;
            configuration = void 0;
            _context2.prev = 12;
            _context2.next = 15;
            return application.getConfiguration({ directory: directory });

          case 15:
            configuration = _context2.sent;
            _context2.next = 42;
            break;

          case 18:
            _context2.prev = 18;
            _context2.t0 = _context2['catch'](12);
            _context2.t1 = _context2.t0.code;
            _context2.next = _context2.t1 === 'EFILENOTFOUND' ? 23 : _context2.t1 === 'EFILENOTACCESSIBLE' ? 30 : _context2.t1 === 'EJSONMALFORMED' ? 32 : _context2.t1 === 'ECONFIGURATIONNOTFOUND' ? 34 : _context2.t1 === 'ECONFIGURATIONMALFORMED' ? 36 : _context2.t1 === 'EVERSIONNOTFOUND' ? 38 : 40;
            break;

          case 23:
            if (isPackageJsonRequired) {
              _context2.next = 28;
              break;
            }

            progress({ message: 'package.json is missing, using fallback configuration.' });

            _context2.next = 27;
            return getFallbackConfiguration();

          case 27:
            return _context2.abrupt('return', _context2.sent);

          case 28:

            progress({ message: 'package.json is missing.', type: 'info' });
            return _context2.abrupt('break', 41);

          case 30:
            progress({ message: 'package.json is not accessible.', type: 'info' });
            return _context2.abrupt('break', 41);

          case 32:
            progress({ message: 'package.json contains malformed JSON.', type: 'info' });
            return _context2.abrupt('break', 41);

          case 34:
            progress({ message: 'package.json does not contain wolkenkit configuration.', type: 'info' });
            return _context2.abrupt('break', 41);

          case 36:
            progress({ message: 'package.json contains malformed wolkenkit configuration.', type: 'info' });
            return _context2.abrupt('break', 41);

          case 38:
            progress({ message: 'package.json contains an unknown runtime version.', type: 'info' });
            return _context2.abrupt('break', 41);

          case 40:
            progress({ message: _context2.t0.message, type: 'info' });

          case 41:
            throw _context2.t0;

          case 42:
            if (configuration.environments[env]) {
              _context2.next = 45;
              break;
            }

            progress({ message: 'package.json does not contain environment ' + env + '.', type: 'info' });
            throw new errors.EnvironmentNotFound();

          case 45:
            return _context2.abrupt('return', configuration);

          case 46:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[12, 18]]);
  }));

  return function getConfiguration(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getConfiguration;