'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var fs = require('fs');

var promisify = require('util.promisify');

var errors = require('../errors');

var readFile = promisify(fs.readFile);

var readJson = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(path) {
    var data, json;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (path) {
              _context.next = 2;
              break;
            }

            throw new Error('Path is missing.');

          case 2:
            data = void 0;
            _context.prev = 3;
            _context.next = 6;
            return readFile(path, { encoding: 'utf8' });

          case 6:
            data = _context.sent;
            _context.next = 17;
            break;

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](3);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'ENOENT' ? 14 : _context.t1 === 'EACCES' ? 15 : 16;
            break;

          case 14:
            throw new errors.FileNotFound();

          case 15:
            throw new errors.FileNotAccessible();

          case 16:
            throw _context.t0;

          case 17:
            json = void 0;
            _context.prev = 18;

            json = JSON.parse(data);
            _context.next = 25;
            break;

          case 22:
            _context.prev = 22;
            _context.t2 = _context['catch'](18);
            throw new errors.JsonMalformed();

          case 25:
            return _context.abrupt('return', json);

          case 26:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[3, 9], [18, 22]]);
  }));

  return function readJson(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = readJson;