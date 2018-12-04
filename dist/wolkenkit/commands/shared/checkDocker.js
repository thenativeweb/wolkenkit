'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    runtimes = require('../../runtimes');

var checkDocker =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, progress) {
    var configuration, env, isInstalled, latestStableVersion, wolkenkitUrl;
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
            if (progress) {
              _context.next = 8;
              break;
            }

            throw new Error('Progress is missing.');

          case 8:
            configuration = options.configuration, env = options.env;
            _context.next = 11;
            return docker.isInstalled();

          case 11:
            isInstalled = _context.sent;
            _context.next = 14;
            return runtimes.getLatestStableVersion();

          case 14:
            latestStableVersion = _context.sent;
            wolkenkitUrl = "https://docs.wolkenkit.io/".concat(latestStableVersion, "/getting-started/installing-wolkenkit/verifying-system-requirements/");

            if (isInstalled) {
              _context.next = 19;
              break;
            }

            progress({
              message: "Docker client is not installed (see ".concat(wolkenkitUrl, " for how to install wolkenkit)."),
              type: 'info'
            });
            throw new errors.ExecutableNotFound();

          case 19:
            _context.prev = 19;
            _context.next = 22;
            return docker.ping({
              configuration: configuration,
              env: env
            });

          case 22:
            _context.next = 38;
            break;

          case 24:
            _context.prev = 24;
            _context.t0 = _context["catch"](19);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'EEXECUTABLEFAILED' ? 29 : _context.t1 === 'EDOCKERNOTREACHABLE' ? 32 : _context.t1 === 'EVERSIONMISMATCH' ? 34 : 36;
            break;

          case 29:
            progress({
              message: _context.t0.message
            });
            progress({
              message: 'Failed to run Docker client.',
              type: 'info'
            });
            return _context.abrupt("break", 37);

          case 32:
            progress({
              message: 'Failed to reach Docker server.',
              type: 'info'
            });
            return _context.abrupt("break", 37);

          case 34:
            progress({
              message: _context.t0.message,
              type: 'info'
            });
            return _context.abrupt("break", 37);

          case 36:
            progress({
              message: _context.t0.message,
              type: 'info'
            });

          case 37:
            throw _context.t0;

          case 38:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[19, 24]]);
  }));

  return function checkDocker(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = checkDocker;