'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var docker = require('../../../docker'),
    errors = require('../../../errors');

var checkDocker = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options, progress) {
    var configuration, env, isInstalled;
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
            if (progress) {
              _context.next = 8;
              break;
            }

            throw new Error('Progress is missing.');

          case 8:
            configuration = options.configuration, env = options.env;
            _context.next = 11;
            return docker.isInstalled();

          case 11:
            isInstalled = _context.sent;

            if (isInstalled) {
              _context.next = 15;
              break;
            }

            progress({ message: 'Docker client is not installed.', type: 'info' });
            throw new errors.ExecutableNotFound();

          case 15:
            _context.prev = 15;
            _context.next = 18;
            return docker.ping({ configuration: configuration, env: env });

          case 18:
            _context.next = 34;
            break;

          case 20:
            _context.prev = 20;
            _context.t0 = _context['catch'](15);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'EEXECUTABLEFAILED' ? 25 : _context.t1 === 'EDOCKERNOTREACHABLE' ? 28 : _context.t1 === 'EVERSIONMISMATCH' ? 30 : 32;
            break;

          case 25:
            progress({ message: _context.t0.message });
            progress({ message: 'Failed to run Docker client.', type: 'info' });
            return _context.abrupt('break', 33);

          case 28:
            progress({ message: 'Failed to reach Docker server.', type: 'info' });
            return _context.abrupt('break', 33);

          case 30:
            progress({ message: _context.t0.message, type: 'info' });
            return _context.abrupt('break', 33);

          case 32:
            progress({ message: _context.t0.message, type: 'info' });

          case 33:
            throw _context.t0;

          case 34:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[15, 20]]);
  }));

  return function checkDocker(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = checkDocker;