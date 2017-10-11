'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var shell = require('../shell');

var getLatestPackageVersion = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(name) {
    var output, latestPackageVersion;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (name) {
              _context.next = 2;
              break;
            }

            throw new Error('Name is missing.');

          case 2:
            _context.next = 4;
            return shell.exec('npm view ' + name + ' version', { silent: true });

          case 4:
            output = _context.sent;
            latestPackageVersion = output.stdout.replace(/(\r\n|\n|\r)/gm, '');
            return _context.abrupt('return', latestPackageVersion);

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getLatestPackageVersion(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getLatestPackageVersion;