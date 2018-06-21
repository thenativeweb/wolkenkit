'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var aufwind = require('./aufwind'),
    cli = require('./cli'),
    noop = require('../../../noop'),
    shared = require('../shared');

var restartVia = {
  aufwind: aufwind,
  cli: cli
};

var restart = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var directory, env, privateKey, configuration, environment, type;
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
            directory = options.directory, env = options.env, privateKey = options.privateKey;
            _context.next = 9;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: true
            }, progress);

          case 9:
            configuration = _context.sent;
            environment = configuration.environments[env];
            type = environment.type === 'aufwind' ? environment.type : 'cli';
            _context.next = 14;
            return restartVia[type]({ directory: directory, env: env, privateKey: privateKey, configuration: configuration }, progress);

          case 14:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function restart(_x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = restart;