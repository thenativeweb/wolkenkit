'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var isInUse = require('./isInUse'),
    isPartiallyInUse = require('./isPartiallyInUse');

var getUsageStatus = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var configuration, env, forVersion, isRuntimeInUse, isRuntimePartiallyInUse, usageStatus;
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
            if (options.forVersion) {
              _context.next = 8;
              break;
            }

            throw new Error('Version is missing.');

          case 8:
            configuration = options.configuration, env = options.env, forVersion = options.forVersion;
            _context.next = 11;
            return isInUse({ configuration: configuration, env: env, forVersion: forVersion });

          case 11:
            isRuntimeInUse = _context.sent;
            _context.next = 14;
            return isPartiallyInUse({ configuration: configuration, env: env, forVersion: forVersion });

          case 14:
            isRuntimePartiallyInUse = _context.sent;
            usageStatus = 'not-used';


            if (isRuntimeInUse) {
              usageStatus = 'used';
            }
            if (isRuntimePartiallyInUse) {
              usageStatus = 'partially-used';
            }

            return _context.abrupt('return', usageStatus);

          case 19:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getUsageStatus(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getUsageStatus;