'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var isImageInUse = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var configuration, env, name, version, environmentVariables, _ref2, stdout, isInUse;

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
            if (options.configuration) {
              _context.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (options.name) {
              _context.next = 8;
              break;
            }

            throw new Error('Name is missing.');

          case 8:
            if (options.version) {
              _context.next = 10;
              break;
            }

            throw new Error('Version is missing.');

          case 10:
            configuration = options.configuration, env = options.env, name = options.name, version = options.version;
            _context.next = 13;
            return getEnvironmentVariables({ configuration: configuration, env: env });

          case 13:
            environmentVariables = _context.sent;
            _context.next = 16;
            return shell.exec('docker ps -a -q --filter ancestor=' + name + ':' + version, {
              env: environmentVariables
            });

          case 16:
            _ref2 = _context.sent;
            stdout = _ref2.stdout;
            isInUse = stdout !== '';
            return _context.abrupt('return', isInUse);

          case 20:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function isImageInUse(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = isImageInUse;