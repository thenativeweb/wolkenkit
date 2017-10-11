'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var docker = require('../../../docker'),
    errors = require('../../../errors');

var checkDocker = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options, progress) {
    var configuration, env, isInstalled;
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