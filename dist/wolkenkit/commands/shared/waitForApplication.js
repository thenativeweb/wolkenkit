'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var nodeenv = require('nodeenv'),
    request = require('requestretry');

var errors = require('../../../errors');

var waitForApplication = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options, progress) {
    var configuration, env, restoreEnvironment, result;
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
            restoreEnvironment = nodeenv('NODE_TLS_REJECT_UNAUTHORIZED', '0');
            _context.next = 12;
            return request({
              url: 'https://' + configuration.environments[env].api.address.host + ':' + configuration.environments[env].api.address.port + '/v1/ping',
              json: true,
              fullResponse: false,
              maxAttempts: 60,
              retryDelay: 2 * 1000,
              retryStrategy: request.RetryStrategies.HTTPOrNetworkError
            });

          case 12:
            result = _context.sent;


            restoreEnvironment();

            if (!(result.api !== 'v1')) {
              _context.next = 16;
              break;
            }

            throw new errors.JsonMalformed();

          case 16:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function waitForApplication(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = waitForApplication;