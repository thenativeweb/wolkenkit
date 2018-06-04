'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var docker = require('../../../docker'),
    runtimes = require('../../runtimes');

var destroyData = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(options, progress) {
    var _this = this;

    var configuration, env, sharedKey, persistData, debug, runtime, containers;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (options) {
              _context2.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.configuration) {
              _context2.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.env) {
              _context2.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (options.sharedKey) {
              _context2.next = 8;
              break;
            }

            throw new Error('Shared key is missing.');

          case 8:
            if (!(options.persistData === undefined)) {
              _context2.next = 10;
              break;
            }

            throw new Error('Persist data is missing.');

          case 10:
            if (!(options.debug === undefined)) {
              _context2.next = 12;
              break;
            }

            throw new Error('Debug is missing.');

          case 12:
            if (progress) {
              _context2.next = 14;
              break;
            }

            throw new Error('Progress is missing.');

          case 14:
            configuration = options.configuration, env = options.env, sharedKey = options.sharedKey, persistData = options.persistData, debug = options.debug;
            runtime = configuration.runtime.version;
            _context2.next = 18;
            return runtimes.getContainers({
              forVersion: runtime,
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            });

          case 18:
            containers = _context2.sent;
            _context2.next = 21;
            return _promise2.default.all(containers.map(function () {
              var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(container) {
                return _regenerator2.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        return _context.abrupt('return', docker.removeVolume({ configuration: configuration, env: env, name: container.name + '-volume' }));

                      case 1:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this);
              }));

              return function (_x3) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 21:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function destroyData(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = destroyData;