'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2.default)(["\n    docker run\n      --detach\n      ", "\n      ", "\n      ", "\n      ", "\n      ", "\n      ", "\n      ", "\n      ", "\n      --name \"", "\"\n      ", "\n      ", "\n  "]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var map = require('lodash/map'),
    _require = require('common-tags'),
    oneLine = _require.oneLine;

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var escape = function escape(value) {
  if (value === undefined) {
    throw new Error('Value is missing.');
  }

  if ((0, _typeof2.default)(value) !== 'object') {
    return value;
  }

  var escapedValue = JSON.stringify(JSON.stringify(value)).slice(1, -1);
  return escapedValue;
};

var startContainer =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var configuration, env, container, environmentVariables;
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
            if (options.container) {
              _context.next = 8;
              break;
            }

            throw new Error('Container is missing.');

          case 8:
            configuration = options.configuration, env = options.env, container = options.container;
            _context.next = 11;
            return getEnvironmentVariables({
              configuration: configuration,
              env: env
            });

          case 11:
            environmentVariables = _context.sent;
            _context.next = 14;
            return shell.exec(oneLine(_templateObject(), container.env ? map(container.env, function (value, key) {
              return "--env ".concat(key, "=\"").concat(escape(value), "\"");
            }).join(' ') : '', container.labels ? map(container.labels, function (value, key) {
              return "--label ".concat(key, "=\"").concat(value, "\"");
            }).join(' ') : '', container.networks ? map(container.networks, function (network) {
              return "--network \"".concat(network, "\"");
            }).join(' ') : '', container.networkAlias ? "--network-alias \"".concat(container.networkAlias, "\"") : '', container.ports ? map(container.ports, function (portHost, portContainer) {
              return "--publish ".concat(portHost, ":").concat(portContainer);
            }).join(' ') : '', container.restart ? "--restart \"".concat(container.restart, "\"") : '', container.volumes ? map(container.volumes, function (volume) {
              return "--volume \"".concat(volume, "\"");
            }).join(' ') : '', container.volumesFrom ? map(container.volumesFrom, function (volumeFrom) {
              return "--volumes-from \"".concat(volumeFrom, "\"");
            }).join(' ') : '', container.name, container.image, container.cmd ? container.cmd : ''), {
              env: environmentVariables
            });

          case 14:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function startContainer(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = startContainer;