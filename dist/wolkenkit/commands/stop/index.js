'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var aufwind = require('./aufwind'),
    cli = require('./cli'),
    noop = require('../../../noop'),
    shared = require('../shared');

var stopVia = {
  aufwind: aufwind,
  cli: cli
};

var stop =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var dangerouslyDestroyData,
        directory,
        env,
        _ref$port,
        port,
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
            dangerouslyDestroyData = _ref.dangerouslyDestroyData, directory = _ref.directory, env = _ref.env, _ref$port = _ref.port, port = _ref$port === void 0 ? undefined : _ref$port, _ref$privateKey = _ref.privateKey, privateKey = _ref$privateKey === void 0 ? undefined : _ref$privateKey;
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (!(dangerouslyDestroyData === undefined)) {
              _context.next = 4;
              break;
            }

            throw new Error('Dangerously destroy data is missing.');

          case 4:
            if (directory) {
              _context.next = 6;
              break;
            }

            throw new Error('Directory is missing.');

          case 6:
            if (env) {
              _context.next = 8;
              break;
            }

            throw new Error('Environment is missing.');

          case 8:
            _context.next = 10;
            return shared.getConfiguration({
              directory: directory,
              env: env,
              isPackageJsonRequired: true,
              port: port
            }, progress);

          case 10:
            configuration = _context.sent;
            type = configuration.type;
            _context.next = 14;
            return stopVia[type]({
              configuration: configuration,
              dangerouslyDestroyData: dangerouslyDestroyData,
              directory: directory,
              env: env,
              port: port,
              privateKey: privateKey
            }, progress);

          case 14:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function stop(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = stop;