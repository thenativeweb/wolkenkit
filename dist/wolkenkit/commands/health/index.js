'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var checkCertificate = require('./checkCertificate'),
    checkDockerServerResolvesToApplicationAddresses = require('./checkDockerServerResolvesToApplicationAddresses'),
    noop = require('../../../noop'),
    resolveHost = require('./resolveHost'),
    shared = require('../shared');

var health = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var directory, env, configuration, applicationAddresses;
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
            if (options.directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            directory = options.directory, env = options.env;
            _context.next = 9;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: true
            }, progress);

          case 9:
            configuration = _context.sent;
            _context.next = 12;
            return shared.checkDocker({ configuration: configuration, env: env }, progress);

          case 12:
            _context.next = 14;
            return resolveHost({ configuration: configuration, env: env }, progress);

          case 14:
            applicationAddresses = _context.sent;
            _context.next = 17;
            return checkDockerServerResolvesToApplicationAddresses({ configuration: configuration, env: env, applicationAddresses: applicationAddresses }, progress);

          case 17:
            _context.next = 19;
            return checkCertificate({ configuration: configuration, env: env, directory: directory }, progress);

          case 19:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function health(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = health;