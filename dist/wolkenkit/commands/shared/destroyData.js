'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../../docker');

var destroyData =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(_ref, progress) {
    var configuration, dangerouslyExposeHttpPorts, debug, persistData, sharedKey, containers;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            configuration = _ref.configuration, dangerouslyExposeHttpPorts = _ref.dangerouslyExposeHttpPorts, debug = _ref.debug, persistData = _ref.persistData, sharedKey = _ref.sharedKey;

            if (configuration) {
              _context2.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (!(dangerouslyExposeHttpPorts === undefined)) {
              _context2.next = 5;
              break;
            }

            throw new Error('Dangerously expose http ports is missing.');

          case 5:
            if (!(debug === undefined)) {
              _context2.next = 7;
              break;
            }

            throw new Error('Debug is missing.');

          case 7:
            if (!(persistData === undefined)) {
              _context2.next = 9;
              break;
            }

            throw new Error('Persist data is missing.');

          case 9:
            if (sharedKey) {
              _context2.next = 11;
              break;
            }

            throw new Error('Shared key is missing.');

          case 11:
            if (progress) {
              _context2.next = 13;
              break;
            }

            throw new Error('Progress is missing.');

          case 13:
            _context2.next = 15;
            return configuration.containers({
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: sharedKey
            });

          case 15:
            containers = _context2.sent;
            _context2.next = 18;
            return Promise.all(containers.map(
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(container) {
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        return _context.abrupt("return", docker.removeVolume({
                          configuration: configuration,
                          name: "".concat(container.name, "-volume")
                        }));

                      case 1:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x3) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 18:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function destroyData(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = destroyData;