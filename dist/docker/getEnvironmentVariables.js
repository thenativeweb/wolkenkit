'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var hash = require('object-hash'),
    processenv = require('processenv');

var errors = require('../errors'),
    shell = require('../shell');

var cache = {};

var getEnvironmentVariables =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, cacheKey, environmentVariables, _ref3, stdout, matches;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            cacheKey = "".concat(hash(_objectSpread({}, configuration, {
              containers: null
            })), "-").concat(configuration.environment);

            if (!cache[cacheKey]) {
              _context.next = 6;
              break;
            }

            return _context.abrupt("return", cache[cacheKey]);

          case 6:
            environmentVariables = processenv();

            if (!(!configuration.docker || !configuration.docker.machine)) {
              _context.next = 10;
              break;
            }

            cache[cacheKey] = environmentVariables;
            return _context.abrupt("return", environmentVariables);

          case 10:
            _context.next = 12;
            return shell.exec("docker-machine env --shell bash ".concat(configuration.docker.machine));

          case 12:
            _ref3 = _context.sent;
            stdout = _ref3.stdout;
            matches = stdout.match(/^export .*$/gm);

            if (matches) {
              _context.next = 17;
              break;
            }

            throw new errors.OutputMalformed();

          case 17:
            matches.map(function (match) {
              return match.replace(/^export /, '');
            }).map(function (match) {
              return match.replace(/"/g, '');
            }).forEach(function (match) {
              var _match$split = match.split('='),
                  _match$split2 = (0, _slicedToArray2.default)(_match$split, 2),
                  key = _match$split2[0],
                  value = _match$split2[1];

              environmentVariables[key] = value;
            });
            cache[cacheKey] = environmentVariables;
            return _context.abrupt("return", environmentVariables);

          case 20:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function getEnvironmentVariables(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getEnvironmentVariables;