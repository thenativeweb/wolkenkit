'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var noop = require('../../../noop'),
    runtimes = require('../../runtimes');

var lsRemote = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var progress = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : noop;
    var versions;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return runtimes.getAllVersions();

          case 2:
            versions = _context.sent;


            progress({ message: 'Available wolkenkit versions:', type: 'info' });

            versions.forEach(function (version) {
              progress({ message: version, type: 'list' });
            });

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function lsRemote() {
    return _ref.apply(this, arguments);
  };
}();

module.exports = lsRemote;