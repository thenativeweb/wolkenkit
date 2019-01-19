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
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var configuration, isInstalled, latestStableVersion, wolkenkitUrl;
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
            if (progress) {
              _context.next = 5;
              break;
            }

            throw new Error('Progress is missing.');

          case 5:
            _context.next = 7;
            return docker.isInstalled();

          case 7:
            isInstalled = _context.sent;

            if (isInstalled) {
              _context.next = 15;
              break;
            }

            _context.next = 11;
            return runtimes.getLatestStableVersion();

          case 11:
            latestStableVersion = _context.sent;
            wolkenkitUrl = "https://docs.wolkenkit.io/".concat(latestStableVersion, "/getting-started/installing-wolkenkit/verifying-system-requirements/");
            progress({
              message: "Docker client is not installed (see ".concat(wolkenkitUrl, " for how to install wolkenkit)."),
              type: 'info'
            });
            throw new errors.ExecutableNotFound();

          case 15:
            _context.prev = 15;
            _context.next = 18;
            return docker.ping({
              configuration: configuration
            });

          case 18:
            _context.next = 34;
            break;

          case 20:
            _context.prev = 20;
            _context.t0 = _context["catch"](15);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'EEXECUTABLEFAILED' ? 25 : _context.t1 === 'EDOCKERNOTREACHABLE' ? 28 : _context.t1 === 'EVERSIONMISMATCH' ? 30 : 32;
            break;

          case 25:
            progress({
              message: _context.t0.message
            });
            progress({
              message: 'Failed to run Docker client.',
              type: 'info'
            });
            return _context.abrupt("break", 33);

          case 28:
            progress({
              message: 'Failed to reach Docker server.',
              type: 'info'
            });
            return _context.abrupt("break", 33);

          case 30:
            progress({
              message: _context.t0.message,
              type: 'info'
            });
            return _context.abrupt("break", 33);

          case 32:
            progress({
              message: _context.t0.message,
              type: 'info'
            });

          case 33:
            throw _context.t0;

          case 34:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[15, 20]]);
  }));

  return function checkDocker(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = checkDocker;