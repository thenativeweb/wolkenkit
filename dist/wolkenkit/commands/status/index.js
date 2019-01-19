'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var aufwind = require('./aufwind'),
    cli = require('./cli'),
    noop = require('../../../noop'),
    shared = require('../shared');

var statusVia = {
  aufwind: aufwind,
  cli: cli
};

var status =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var directory,
        env,
        _ref$privateKey,
        privateKey,
        progress,
        configuration,
        type,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = _ref.directory, env = _ref.env, _ref$privateKey = _ref.privateKey, privateKey = _ref$privateKey === void 0 ? undefined : _ref$privateKey;
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            _context.next = 8;
            return shared.getConfiguration({
              directory: directory,
              env: env,
              isPackageJsonRequired: true
            }, progress);

          case 8:
            configuration = _context.sent;
            type = configuration.type;
            _context.next = 12;
            return statusVia[type]({
              configuration: configuration,
              directory: directory,
              env: env,
              privateKey: privateKey
            }, progress);

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function status(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = status;