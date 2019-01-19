'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var flatten = require('lodash/flatten'),
    map = require('lodash/map'),
    merge = require('lodash/merge');

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var getContainers =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, where, environmentVariables, filter, _ref3, stdout, containers;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, where = _ref.where;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (where) {
              _context.next = 5;
              break;
            }

            throw new Error('Where is missing.');

          case 5:
            _context.next = 7;
            return getEnvironmentVariables({
              configuration: configuration
            });

          case 7:
            environmentVariables = _context.sent;
            filter = flatten(map(where, function (keyValuePair, criterion) {
              return map(keyValuePair, function (value, key) {
                return "--filter \"".concat(criterion, "=").concat(key, "=").concat(value, "\"");
              });
            }));
            _context.next = 11;
            return shell.exec("docker ps --all ".concat(filter.join(' '), " --format \"{{json .}}\""), {
              env: environmentVariables
            });

          case 11:
            _ref3 = _context.sent;
            stdout = _ref3.stdout;
            containers = stdout.split('\n').filter(function (item) {
              return item;
            }).map(function (item) {
              return JSON.parse(item);
            }).map(function (container) {
              return {
                name: container.Names,
                labels: container.Labels.split(',').map(function (label) {
                  var _label$split = label.split('='),
                      _label$split2 = (0, _slicedToArray2.default)(_label$split, 2),
                      key = _label$split2[0],
                      value = _label$split2[1];

                  return (0, _defineProperty2.default)({}, key, value);
                }).reduce(function (labels, label) {
                  return merge({}, labels, label);
                })
              };
            });
            return _context.abrupt("return", containers);

          case 15:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getContainers(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getContainers;