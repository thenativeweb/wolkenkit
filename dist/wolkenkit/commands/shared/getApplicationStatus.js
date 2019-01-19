'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../../docker');

var getApplicationStatus =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var configuration, dangerouslyExposeHttpPorts, debug, persistData, sharedKey, existingContainers, containers;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, dangerouslyExposeHttpPorts = _ref.dangerouslyExposeHttpPorts, debug = _ref.debug, persistData = _ref.persistData, sharedKey = _ref.sharedKey;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (!(dangerouslyExposeHttpPorts === undefined)) {
              _context.next = 5;
              break;
            }

            throw new Error('Dangerously expose http ports is missing.');

          case 5:
            if (!(debug === undefined)) {
              _context.next = 7;
              break;
            }

            throw new Error('Debug is missing.');

          case 7:
            if (!(persistData === undefined)) {
              _context.next = 9;
              break;
            }

            throw new Error('Persist data is missing.');

          case 9:
            if (sharedKey) {
              _context.next = 11;
              break;
            }

            throw new Error('Shared key is missing.');

          case 11:
            if (progress) {
              _context.next = 13;
              break;
            }

            throw new Error('Progress is missing.');

          case 13:
            _context.next = 15;
            return docker.getContainers({
              configuration: configuration,
              where: {
                label: {
                  'wolkenkit-application': configuration.application.name
                }
              }
            });

          case 15:
            existingContainers = _context.sent;

            if (!(existingContainers.length === 0)) {
              _context.next = 18;
              break;
            }

            return _context.abrupt("return", 'not-running');

          case 18:
            _context.next = 20;
            return configuration.containers({
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: sharedKey
            });

          case 20:
            containers = _context.sent;

            if (!(existingContainers.length < containers.length)) {
              _context.next = 23;
              break;
            }

            return _context.abrupt("return", 'partially-running');

          case 23:
            return _context.abrupt("return", 'running');

          case 24:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getApplicationStatus(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getApplicationStatus;