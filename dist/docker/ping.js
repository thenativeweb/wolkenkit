'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dockerCompare = require('docker-compare');

var errors = require('../errors'),
    getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var ping = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var configuration, env, runtimeVersion, docker, environmentVariables, output, _result, result;

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
            configuration = options.configuration, env = options.env;
            runtimeVersion = void 0;
            _context.prev = 8;

            runtimeVersion = configuration.runtime.version;
            _context.next = 15;
            break;

          case 12:
            _context.prev = 12;
            _context.t0 = _context['catch'](8);
            throw new errors.ConfigurationMalformed();

          case 15:
            docker = void 0;
            _context.prev = 16;

            /* eslint-disable global-require */
            docker = require('../configuration/' + runtimeVersion + '/docker')();
            /* eslint-enable global-require */
            _context.next = 27;
            break;

          case 20:
            _context.prev = 20;
            _context.t1 = _context['catch'](16);
            _context.t2 = _context.t1.code;
            _context.next = _context.t2 === 'MODULE_NOT_FOUND' ? 25 : 26;
            break;

          case 25:
            throw new errors.VersionNotFound();

          case 26:
            throw _context.t1;

          case 27:
            _context.next = 29;
            return getEnvironmentVariables({ configuration: configuration, env: env });

          case 29:
            environmentVariables = _context.sent;
            output = void 0;
            _context.prev = 31;
            _context.next = 34;
            return shell.exec('docker version --format "{{json .}}"', {
              env: environmentVariables
            });

          case 34:
            output = _context.sent;
            _context.next = 50;
            break;

          case 37:
            _context.prev = 37;
            _context.t3 = _context['catch'](31);
            _result = void 0;
            _context.prev = 40;

            _result = JSON.parse(_context.t3.stdout);
            _context.next = 47;
            break;

          case 44:
            _context.prev = 44;
            _context.t4 = _context['catch'](40);
            throw _context.t3;

          case 47:
            if (!(_result.Client && !_result.Server)) {
              _context.next = 49;
              break;
            }

            throw new errors.DockerNotReachable();

          case 49:
            throw _context.t3;

          case 50:
            result = void 0;
            _context.prev = 51;

            result = JSON.parse(output.stdout);
            _context.next = 58;
            break;

          case 55:
            _context.prev = 55;
            _context.t5 = _context['catch'](51);
            throw new errors.JsonMalformed();

          case 58:
            if (!dockerCompare.lessThan(result.Server.Version, docker.minimumVersion)) {
              _context.next = 60;
              break;
            }

            throw new errors.VersionMismatch('Docker server version ' + result.Server.Version + ' is too old, requires ' + docker.minimumVersion + ' or higher.');

          case 60:
            if (!dockerCompare.lessThan(result.Client.Version, docker.minimumVersion)) {
              _context.next = 62;
              break;
            }

            throw new errors.VersionMismatch('Docker client version ' + result.Client.Version + ' is too old, requires ' + docker.minimumVersion + ' or higher.');

          case 62:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[8, 12], [16, 20], [31, 37], [40, 44], [51, 55]]);
  }));

  return function ping(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = ping;