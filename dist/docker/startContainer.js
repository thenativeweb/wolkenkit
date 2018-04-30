'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _taggedTemplateLiteral2 = require('babel-runtime/helpers/taggedTemplateLiteral');

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(['\n    docker run\n      --detach\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      --name "', '"\n      ', '\n      ', '\n  '], ['\n    docker run\n      --detach\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      --name "', '"\n      ', '\n      ', '\n  ']);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var map = require('lodash/map'),
    _require = require('common-tags'),
    oneLine = _require.oneLine;


var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var startContainer = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var configuration, env, container, environmentVariables;
    return _regenerator2.default.wrap(function _callee$(_context) {
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
            return getEnvironmentVariables({ configuration: configuration, env: env });

          case 11:
            environmentVariables = _context.sent;
            _context.next = 14;
            return shell.exec(oneLine(_templateObject, container.env ? map(container.env, function (value, key) {
              return '--env ' + key + '="' + value + '"';
            }).join(' ') : '', container.labels ? map(container.labels, function (value, key) {
              return '--label ' + key + '="' + value + '"';
            }).join(' ') : '', container.networks ? map(container.networks, function (network) {
              return '--network "' + network + '"';
            }).join(' ') : '', container.networkAlias ? '--network-alias "' + container.networkAlias + '"' : '', container.ports ? map(container.ports, function (portHost, portContainer) {
              return '--publish ' + portHost + ':' + portContainer;
            }).join(' ') : '', container.restart ? '--restart "' + container.restart + '"' : '', container.volumes ? map(container.volumes, function (volume) {
              return '--volume "' + volume + '"';
            }).join(' ') : '', container.volumesFrom ? map(container.volumesFrom, function (volumeFrom) {
              return '--volumes-from "' + volumeFrom + '"';
            }).join(' ') : '', container.name, container.image, container.cmd ? container.cmd : ''), {
              env: environmentVariables
            });

          case 14:
          case 'end':
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