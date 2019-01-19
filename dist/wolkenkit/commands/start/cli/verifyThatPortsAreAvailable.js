'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var arrayToSentence = require('array-to-sentence'),
    map = require('lodash/map'),
    portscanner = require('portscanner'),
    sortBy = require('lodash/sortBy');

var errors = require('../../../../errors');

var verifyThatPortsAreAvailable =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var configuration, dangerouslyExposeHttpPorts, debug, persistData, sharedKey, containers, requestedPorts, host, notAvailablePorts, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, port, portStatus;

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
            return configuration.containers({
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: sharedKey
            });

          case 15:
            containers = _context.sent;
            requestedPorts = sortBy(map(containers, function (container) {
              return container.ports;
            }).filter(function (ports) {
              return ports;
            }).reduce(function (list, ports) {
              return [].concat((0, _toConsumableArray2.default)(list), (0, _toConsumableArray2.default)(Object.values(ports)));
            }, []));
            host = configuration.api.host.name;
            notAvailablePorts = [];
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 22;
            _iterator = requestedPorts[Symbol.iterator]();

          case 24:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 36;
              break;
            }

            port = _step.value;
            _context.next = 28;
            return portscanner.checkPortStatus(port, host);

          case 28:
            portStatus = _context.sent;

            if (!(portStatus === 'closed')) {
              _context.next = 32;
              break;
            }

            progress({
              message: "Verified that port ".concat(port, " is available."),
              type: 'verbose'
            });
            return _context.abrupt("continue", 33);

          case 32:
            notAvailablePorts.push(port);

          case 33:
            _iteratorNormalCompletion = true;
            _context.next = 24;
            break;

          case 36:
            _context.next = 42;
            break;

          case 38:
            _context.prev = 38;
            _context.t0 = _context["catch"](22);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 42:
            _context.prev = 42;
            _context.prev = 43;

            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }

          case 45:
            _context.prev = 45;

            if (!_didIteratorError) {
              _context.next = 48;
              break;
            }

            throw _iteratorError;

          case 48:
            return _context.finish(45);

          case 49:
            return _context.finish(42);

          case 50:
            if (!(notAvailablePorts.length === 1)) {
              _context.next = 53;
              break;
            }

            progress({
              message: "Port ".concat(notAvailablePorts[0], " is not available."),
              type: 'info'
            });
            throw new errors.PortsNotAvailable();

          case 53:
            if (!(notAvailablePorts.length > 1)) {
              _context.next = 56;
              break;
            }

            progress({
              message: "Ports ".concat(arrayToSentence(notAvailablePorts), " are not available."),
              type: 'info'
            });
            throw new errors.PortsNotAvailable();

          case 56:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[22, 38, 42, 50], [43,, 45, 49]]);
  }));

  return function verifyThatPortsAreAvailable(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = verifyThatPortsAreAvailable;