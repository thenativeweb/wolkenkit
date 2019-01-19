'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var aufwind = require('./aufwind'),
    cli = require('./cli'),
    noop = require('../../../noop'),
    shared = require('../shared');

var startVia = {
  aufwind: aufwind,
  cli: cli
};

var start =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var directory,
        dangerouslyDestroyData,
        dangerouslyExposeHttpPorts,
        debug,
        env,
        persist,
        port,
        privateKey,
        sharedKey,
        progress,
        configuration,
        type,
        _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = _ref.directory, dangerouslyDestroyData = _ref.dangerouslyDestroyData, dangerouslyExposeHttpPorts = _ref.dangerouslyExposeHttpPorts, debug = _ref.debug, env = _ref.env, persist = _ref.persist, port = _ref.port, privateKey = _ref.privateKey, sharedKey = _ref.sharedKey;
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (!(dangerouslyDestroyData === undefined)) {
              _context.next = 6;
              break;
            }

            throw new Error('Dangerously destroy data is missing.');

          case 6:
            if (!(dangerouslyExposeHttpPorts === undefined)) {
              _context.next = 8;
              break;
            }

            throw new Error('Dangerously expose http ports is missing.');

          case 8:
            if (!(debug === undefined)) {
              _context.next = 10;
              break;
            }

            throw new Error('Debug is missing.');

          case 10:
            if (env) {
              _context.next = 12;
              break;
            }

            throw new Error('Environment is missing.');

          case 12:
            if (!(persist === undefined)) {
              _context.next = 14;
              break;
            }

            throw new Error('Persist is missing.');

          case 14:
            _context.next = 16;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: true,
              port: port
            }, progress);

          case 16:
            configuration = _context.sent;
            shared.validateCode({
              directory: directory
            }, progress);
            type = configuration.type;
            _context.next = 21;
            return startVia[type]({
              configuration: configuration,
              dangerouslyDestroyData: dangerouslyDestroyData,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              directory: directory,
              env: env,
              persist: persist,
              port: port,
              privateKey: privateKey,
              sharedKey: sharedKey
            }, progress);

          case 21:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function start(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = start;