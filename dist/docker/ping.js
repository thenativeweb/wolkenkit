'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var dockerCompare = require('docker-compare');

var errors = require('../errors'),
    getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var ping =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var configuration, env, runtimeVersion, docker, environmentVariables, output, _result, result;

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
            configuration = options.configuration, env = options.env;
            _context.prev = 7;
            runtimeVersion = configuration.runtime.version;
            _context.next = 14;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](7);
            throw new errors.ConfigurationMalformed();

          case 14:
            _context.prev = 14;

            /* eslint-disable global-require */
            docker = require("../configuration/".concat(runtimeVersion, "/docker"))();
            /* eslint-enable global-require */

            _context.next = 25;
            break;

          case 18:
            _context.prev = 18;
            _context.t1 = _context["catch"](14);
            _context.t2 = _context.t1.code;
            _context.next = _context.t2 === 'MODULE_NOT_FOUND' ? 23 : 24;
            break;

          case 23:
            throw new errors.VersionNotFound();

          case 24:
            throw _context.t1;

          case 25:
            _context.next = 27;
            return getEnvironmentVariables({
              configuration: configuration,
              env: env
            });

          case 27:
            environmentVariables = _context.sent;
            _context.prev = 28;
            _context.next = 31;
            return shell.exec("docker version --format \"{{json .}}\"", {
              env: environmentVariables
            });

          case 31:
            output = _context.sent;
            _context.next = 46;
            break;

          case 34:
            _context.prev = 34;
            _context.t3 = _context["catch"](28);
            _context.prev = 36;
            _result = JSON.parse(_context.t3.stdout);
            _context.next = 43;
            break;

          case 40:
            _context.prev = 40;
            _context.t4 = _context["catch"](36);
            throw _context.t3;

          case 43:
            if (!(_result.Client && !_result.Server)) {
              _context.next = 45;
              break;
            }

            throw new errors.DockerNotReachable();

          case 45:
            throw _context.t3;

          case 46:
            _context.prev = 46;
            result = JSON.parse(output.stdout);
            _context.next = 53;
            break;

          case 50:
            _context.prev = 50;
            _context.t5 = _context["catch"](46);
            throw new errors.JsonMalformed();

          case 53:
            if (!dockerCompare.lessThan(result.Server.Version, docker.minimumVersion)) {
              _context.next = 55;
              break;
            }

            throw new errors.VersionMismatch("Docker server version ".concat(result.Server.Version, " is too old, requires ").concat(docker.minimumVersion, " or higher."));

          case 55:
            if (!dockerCompare.lessThan(result.Client.Version, docker.minimumVersion)) {
              _context.next = 57;
              break;
            }

            throw new errors.VersionMismatch("Docker client version ".concat(result.Client.Version, " is too old, requires ").concat(docker.minimumVersion, " or higher."));

          case 57:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[7, 11], [14, 18], [28, 34], [36, 40], [46, 50]]);
  }));

  return function ping(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = ping;