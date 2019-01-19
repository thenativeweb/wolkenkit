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
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, version, docker, environmentVariables, output, _result, result;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            version = configuration.application.runtime.version;
            _context.prev = 4;

            /* eslint-disable global-require */
            docker = require("../configuration/".concat(version, "/docker"))();
            /* eslint-enable global-require */

            _context.next = 15;
            break;

          case 8:
            _context.prev = 8;
            _context.t0 = _context["catch"](4);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'MODULE_NOT_FOUND' ? 13 : 14;
            break;

          case 13:
            throw new errors.VersionNotFound();

          case 14:
            throw _context.t0;

          case 15:
            _context.next = 17;
            return getEnvironmentVariables({
              configuration: configuration
            });

          case 17:
            environmentVariables = _context.sent;
            _context.prev = 18;
            _context.next = 21;
            return shell.exec("docker version --format \"{{json .}}\"", {
              env: environmentVariables
            });

          case 21:
            output = _context.sent;
            _context.next = 36;
            break;

          case 24:
            _context.prev = 24;
            _context.t2 = _context["catch"](18);
            _context.prev = 26;
            _result = JSON.parse(_context.t2.stdout);
            _context.next = 33;
            break;

          case 30:
            _context.prev = 30;
            _context.t3 = _context["catch"](26);
            throw _context.t2;

          case 33:
            if (!(_result.Client && !_result.Server)) {
              _context.next = 35;
              break;
            }

            throw new errors.DockerNotReachable();

          case 35:
            throw _context.t2;

          case 36:
            _context.prev = 36;
            result = JSON.parse(output.stdout);
            _context.next = 43;
            break;

          case 40:
            _context.prev = 40;
            _context.t4 = _context["catch"](36);
            throw new errors.JsonMalformed();

          case 43:
            if (!dockerCompare.lessThan(result.Server.Version, docker.minimumVersion)) {
              _context.next = 45;
              break;
            }

            throw new errors.VersionMismatch("Docker server version ".concat(result.Server.Version, " is too old, requires ").concat(docker.minimumVersion, " or higher."));

          case 45:
            if (!dockerCompare.lessThan(result.Client.Version, docker.minimumVersion)) {
              _context.next = 47;
              break;
            }

            throw new errors.VersionMismatch("Docker client version ".concat(result.Client.Version, " is too old, requires ").concat(docker.minimumVersion, " or higher."));

          case 47:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[4, 8], [18, 24], [26, 30], [36, 40]]);
  }));

  return function ping(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = ping;