'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var docker = require('../../../../docker'),
    errors = require('../../../../errors'),
    health = require('../../health'),
    shared = require('../../shared');

var cli = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options, progress) {
    var directory, env, configuration, existingContainers, debug, persistData, sharedKey, applicationStatus;
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
            directory = options.directory, env = options.env, configuration = options.configuration;
            _context.next = 13;
            return shared.checkDocker({ configuration: configuration, env: env }, progress);

          case 13:

            progress({ message: 'Verifying health on environment ' + env + '...', type: 'info' });
            _context.next = 16;
            return health({ directory: directory, env: env }, progress);

          case 16:
            _context.next = 18;
            return docker.getContainers({
              configuration: configuration,
              env: env,
              where: { label: { 'wolkenkit-application': configuration.application } }
            });

          case 18:
            existingContainers = _context.sent;


            progress({ message: 'Verifying application status...', type: 'info' });

            // We can not use the application status here, because for that we need to
            // fetch the labels of the containers. So this would be a chicken-and-egg
            // problem, hence this workaround.

            if (!(existingContainers.length === 0)) {
              _context.next = 22;
              break;
            }

            throw new errors.ApplicationNotRunning();

          case 22:
            debug = existingContainers[0].labels['wolkenkit-debug'] === 'true', persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true', sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];
            _context.next = 25;
            return shared.getApplicationStatus({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 25:
            applicationStatus = _context.sent;

            if (!(applicationStatus === 'partially-running')) {
              _context.next = 28;
              break;
            }

            throw new errors.ApplicationPartiallyRunning();

          case 28:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function cli(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = cli;