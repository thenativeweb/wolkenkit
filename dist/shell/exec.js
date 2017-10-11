'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var childProcess = require('child_process');

var processenv = require('processenv'),
    promisify = require('util.promisify');

var errors = require('../errors');

var childProcessExec = promisify(childProcess.exec);

var exec = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(command) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var cwd, env, output, error;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (command) {
              _context.next = 2;
              break;
            }

            throw new Error('Command is missing.');

          case 2:
            cwd = options.cwd || process.cwd(), env = options.env || processenv();
            output = void 0;
            _context.prev = 4;
            _context.next = 7;
            return childProcessExec(command, { cwd: cwd, env: env });

          case 7:
            output = _context.sent;
            _context.next = 16;
            break;

          case 10:
            _context.prev = 10;
            _context.t0 = _context['catch'](4);
            error = new errors.ExecutableFailed(_context.t0.stderr);


            error.stdout = _context.t0.stdout;
            error.stderr = _context.t0.stderr;

            throw error;

          case 16:
            return _context.abrupt('return', output);

          case 17:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[4, 10]]);
  }));

  return function exec(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = exec;