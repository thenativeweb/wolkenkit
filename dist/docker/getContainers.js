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
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var configuration, env, where, environmentVariables, filter, _ref2, stdout, containers;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (options) {
              _context.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.configuration) {
              _context.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (options.where) {
              _context.next = 8;
              break;
            }

            throw new Error('Where is missing.');

          case 8:
            configuration = options.configuration, env = options.env, where = options.where;
            _context.next = 11;
            return getEnvironmentVariables({
              configuration: configuration,
              env: env
            });

          case 11:
            environmentVariables = _context.sent;
            filter = flatten(map(where, function (keyValuePair, criterion) {
              return map(keyValuePair, function (value, key) {
                return "--filter \"".concat(criterion, "=").concat(key, "=").concat(value, "\"");
              });
            }));
            _context.next = 15;
            return shell.exec("docker ps --all ".concat(filter.join(' '), " --format \"{{json .}}\""), {
              env: environmentVariables
            });

          case 15:
            _ref2 = _context.sent;
            stdout = _ref2.stdout;
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

          case 19:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getContainers(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getContainers;