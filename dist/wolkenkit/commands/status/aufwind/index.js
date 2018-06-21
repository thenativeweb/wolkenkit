'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = require('../../../../errors'),
    shared = require('../../shared');

var aufwind = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options, progress) {
    var directory, env, privateKey, configuration, tunnel, application, endpoint, response;
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
            if (options.directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (options.configuration) {
              _context.next = 8;
              break;
            }

            throw new Error('Configuration is missing.');

          case 8:
            if (progress) {
              _context.next = 10;
              break;
            }

            throw new Error('Progress is missing.');

          case 10:
            directory = options.directory, env = options.env, privateKey = options.privateKey, configuration = options.configuration;
            _context.next = 13;
            return shared.startTunnel({ configuration: configuration, env: env, privateKey: privateKey }, progress);

          case 13:
            tunnel = _context.sent;
            application = configuration.application;
            endpoint = {
              protocol: 'http:',
              method: 'POST',
              hostname: tunnel.host,
              port: tunnel.port,
              pathname: '/v1/applications/' + application + '/status/' + env
            };
            _context.next = 18;
            return shared.streamApplication({ directory: directory, endpoint: endpoint, tunnel: tunnel }, progress);

          case 18:
            response = _context.sent;

            if (!(response.status === 'not-running')) {
              _context.next = 21;
              break;
            }

            throw new errors.ApplicationNotRunning();

          case 21:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function aufwind(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = aufwind;