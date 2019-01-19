'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

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
            cacheKey = "".concat(hash((0, _objectSpread2.default)({}, configuration, {
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
    }, _callee, this);
  }));

  return function getEnvironmentVariables(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getEnvironmentVariables;