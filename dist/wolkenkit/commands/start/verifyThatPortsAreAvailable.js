'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var map = require('lodash/map'),
    portscanner = require('portscanner'),
    promisify = require('util.promisify');

var errors = require('../../../errors'),
    runtimes = require('../../runtimes');

var findAPortInUse = promisify(portscanner.findAPortInUse);

var verifyThatPortsAreAvailable = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options, progress) {
    var forVersion, configuration, env, sharedKey, persistData, debug, containers, requestedPorts, host, portInUse, arePortsAvailable;
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
            if (options.forVersion) {
              _context.next = 4;
              break;
            }

            throw new Error('For version is missing.');

          case 4:
            if (options.configuration) {
              _context.next = 6;
              break;
            }

            throw new Error('Configuration is missing.');

          case 6:
            if (options.env) {
              _context.next = 8;
              break;
            }

            throw new Error('Environment is missing.');

          case 8:
            if (options.sharedKey) {
              _context.next = 10;
              break;
            }

            throw new Error('Shared key is missing.');

          case 10:
            if (!(options.persistData === undefined)) {
              _context.next = 12;
              break;
            }

            throw new Error('Persist data is missing.');

          case 12:
            if (!(options.debug === undefined)) {
              _context.next = 14;
              break;
            }

            throw new Error('Debug is missing.');

          case 14:
            if (progress) {
              _context.next = 16;
              break;
            }

            throw new Error('Progress is missing.');

          case 16:
            forVersion = options.forVersion, configuration = options.configuration, env = options.env, sharedKey = options.sharedKey, persistData = options.persistData, debug = options.debug;
            _context.next = 19;
            return runtimes.getContainers({
              forVersion: forVersion,
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            });

          case 19:
            containers = _context.sent;
            requestedPorts = map(containers, function (container) {
              return container.ports;
            }).filter(function (ports) {
              return ports;
            }).reduce(function (list, ports) {
              return [].concat(_toConsumableArray(list), _toConsumableArray(Object.values(ports)));
            }, []);
            host = configuration.environments[env].api.address.host;
            _context.next = 24;
            return findAPortInUse(requestedPorts, host);

          case 24:
            portInUse = _context.sent;
            arePortsAvailable = portInUse === false;

            if (!arePortsAvailable) {
              _context.next = 28;
              break;
            }

            return _context.abrupt('return');

          case 28:

            progress({ message: 'The requested ports are not available.', type: 'info' });
            throw new errors.PortsNotAvailable();

          case 30:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function verifyThatPortsAreAvailable(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = verifyThatPortsAreAvailable;