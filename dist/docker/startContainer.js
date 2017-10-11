'use strict';

var _templateObject = _taggedTemplateLiteral(['\n    docker run\n      --detach\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      --name "', '"\n      ', '\n      ', '\n  '], ['\n    docker run\n      --detach\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      ', '\n      --name "', '"\n      ', '\n      ', '\n  ']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var map = require('lodash/map'),
    _require = require('common-tags'),
    oneLine = _require.oneLine;


var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var startContainer = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var configuration, env, container, environmentVariables;
    return regeneratorRuntime.wrap(function _callee$(_context) {
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