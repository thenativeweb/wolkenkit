'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var application = require('../../../application'),
    errors = require('../../../errors'),
    runtimes = require('../../runtimes');

var getFallbackConfiguration =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return runtimes.getLatestStableVersion();

          case 2:
            _context.t0 = _context.sent;
            _context.t1 = {
              version: _context.t0
            };
            _context.t2 = {
              default: {}
            };
            return _context.abrupt("return", {
              runtime: _context.t1,
              environments: _context.t2
            });

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getFallbackConfiguration() {
    return _ref.apply(this, arguments);
  };
}();

var getConfiguration =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(options, progress) {
    var env, directory, isPackageJsonRequired, configuration;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (options) {
              _context2.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.directory) {
              _context2.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.env) {
              _context2.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (!(options.isPackageJsonRequired === undefined)) {
              _context2.next = 8;
              break;
            }

            throw new Error('Is package.json required is missing.');

          case 8:
            if (progress) {
              _context2.next = 10;
              break;
            }

            throw new Error('Progress is missing.');

          case 10:
            env = options.env, directory = options.directory, isPackageJsonRequired = options.isPackageJsonRequired;
            _context2.prev = 11;
            _context2.next = 14;
            return application.getConfiguration({
              directory: directory
            });

          case 14:
            configuration = _context2.sent;
            _context2.next = 41;
            break;

          case 17:
            _context2.prev = 17;
            _context2.t0 = _context2["catch"](11);
            _context2.t1 = _context2.t0.code;
            _context2.next = _context2.t1 === 'EFILENOTFOUND' ? 22 : _context2.t1 === 'EFILENOTACCESSIBLE' ? 29 : _context2.t1 === 'EJSONMALFORMED' ? 31 : _context2.t1 === 'ECONFIGURATIONNOTFOUND' ? 33 : _context2.t1 === 'ECONFIGURATIONMALFORMED' ? 35 : _context2.t1 === 'EVERSIONNOTFOUND' ? 37 : 39;
            break;

          case 22:
            if (isPackageJsonRequired) {
              _context2.next = 27;
              break;
            }

            progress({
              message: 'package.json is missing, using fallback configuration.'
            });
            _context2.next = 26;
            return getFallbackConfiguration();

          case 26:
            return _context2.abrupt("return", _context2.sent);

          case 27:
            progress({
              message: 'package.json is missing.',
              type: 'info'
            });
            return _context2.abrupt("break", 40);

          case 29:
            progress({
              message: 'package.json is not accessible.',
              type: 'info'
            });
            return _context2.abrupt("break", 40);

          case 31:
            progress({
              message: 'package.json contains malformed JSON.',
              type: 'info'
            });
            return _context2.abrupt("break", 40);

          case 33:
            progress({
              message: 'package.json does not contain wolkenkit configuration.',
              type: 'info'
            });
            return _context2.abrupt("break", 40);

          case 35:
            progress({
              message: "package.json contains malformed configuration (".concat(_context2.t0.message.slice(0, -1), ")."),
              type: 'info'
            });
            return _context2.abrupt("break", 40);

          case 37:
            progress({
              message: 'package.json contains an unknown runtime version.',
              type: 'info'
            });
            return _context2.abrupt("break", 40);

          case 39:
            progress({
              message: _context2.t0.message,
              type: 'info'
            });

          case 40:
            throw _context2.t0;

          case 41:
            if (configuration.environments[env]) {
              _context2.next = 44;
              break;
            }

            progress({
              message: "package.json does not contain environment ".concat(env, "."),
              type: 'info'
            });
            throw new errors.EnvironmentNotFound();

          case 44:
            return _context2.abrupt("return", configuration);

          case 45:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[11, 17]]);
  }));

  return function getConfiguration(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getConfiguration;