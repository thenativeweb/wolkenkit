'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var get = require('lodash/get'),
    processenv = require('processenv');

var application = require('../../application'),
    Configuration = require('../../Configuration'),
    errors = require('../../../errors'),
    noop = require('../../../noop'),
    runtimes = require('../../runtimes'),
    switchSemver = require('../../../switchSemver');

var getFallbackConfiguration =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    var latestStableVersion, configuration;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return runtimes.getLatestStableVersion();

          case 2:
            latestStableVersion = _context.sent;
            configuration = new Configuration({
              type: 'cli',
              environment: 'default',
              applicationName: 'fallback',
              runtimeVersion: latestStableVersion,
              apiHostname: 'local.wolkenkit.io',
              apiPort: 3000,
              packageJson: {}
            });
            return _context.abrupt("return", configuration);

          case 5:
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
  var _ref3 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(_ref2) {
    var directory,
        env,
        isPackageJsonRequired,
        _ref2$port,
        port,
        progress,
        packageJson,
        runtimeVersion,
        configuration,
        _args3 = arguments;

    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            directory = _ref2.directory, env = _ref2.env, isPackageJsonRequired = _ref2.isPackageJsonRequired, _ref2$port = _ref2.port, port = _ref2$port === void 0 ? undefined : _ref2$port;
            progress = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : noop;

            if (directory) {
              _context3.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (env) {
              _context3.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (!(isPackageJsonRequired === undefined)) {
              _context3.next = 8;
              break;
            }

            throw new Error('Is package.json required is missing.');

          case 8:
            _context3.prev = 8;
            _context3.next = 11;
            return application.getConfiguration({
              directory: directory
            });

          case 11:
            packageJson = _context3.sent;
            _context3.next = 38;
            break;

          case 14:
            _context3.prev = 14;
            _context3.t0 = _context3["catch"](8);
            _context3.t1 = _context3.t0.code;
            _context3.next = _context3.t1 === 'EFILENOTFOUND' ? 19 : _context3.t1 === 'EFILENOTACCESSIBLE' ? 26 : _context3.t1 === 'EJSONMALFORMED' ? 28 : _context3.t1 === 'ECONFIGURATIONNOTFOUND' ? 30 : _context3.t1 === 'ECONFIGURATIONMALFORMED' ? 32 : _context3.t1 === 'EVERSIONNOTFOUND' ? 34 : 36;
            break;

          case 19:
            if (isPackageJsonRequired) {
              _context3.next = 24;
              break;
            }

            progress({
              message: 'package.json is missing, using fallback configuration.'
            });
            _context3.next = 23;
            return getFallbackConfiguration();

          case 23:
            return _context3.abrupt("return", _context3.sent);

          case 24:
            progress({
              message: 'package.json is missing.',
              type: 'info'
            });
            return _context3.abrupt("break", 37);

          case 26:
            progress({
              message: 'package.json is not accessible.',
              type: 'info'
            });
            return _context3.abrupt("break", 37);

          case 28:
            progress({
              message: 'package.json contains malformed JSON.',
              type: 'info'
            });
            return _context3.abrupt("break", 37);

          case 30:
            progress({
              message: 'package.json does not contain wolkenkit configuration.',
              type: 'info'
            });
            return _context3.abrupt("break", 37);

          case 32:
            progress({
              message: "package.json contains malformed configuration (".concat(_context3.t0.message.slice(0, -1), ")."),
              type: 'info'
            });
            return _context3.abrupt("break", 37);

          case 34:
            progress({
              message: 'package.json contains an unknown runtime version.',
              type: 'info'
            });
            return _context3.abrupt("break", 37);

          case 36:
            progress({
              message: _context3.t0.message,
              type: 'info'
            });

          case 37:
            throw _context3.t0;

          case 38:
            runtimeVersion = packageJson.runtime.version;
            _context3.next = 41;
            return switchSemver(runtimeVersion, {
              default: function () {
                var _default2 = (0, _asyncToGenerator2.default)(
                /*#__PURE__*/
                _regenerator.default.mark(function _callee2() {
                  var selectedEnvironment, type;
                  return _regenerator.default.wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          selectedEnvironment = packageJson.environments[env];

                          if (selectedEnvironment) {
                            _context2.next = 4;
                            break;
                          }

                          progress({
                            message: "package.json does not contain environment ".concat(env, "."),
                            type: 'info'
                          });
                          throw new errors.EnvironmentNotFound();

                        case 4:
                          type = selectedEnvironment.type || 'cli';
                          configuration = new Configuration({
                            type: type,
                            environment: env,
                            applicationName: packageJson.application,
                            runtimeVersion: runtimeVersion,
                            apiHostname: selectedEnvironment.api.address.host,
                            apiPort: port || processenv('WOLKENKIT_PORT') || selectedEnvironment.api.address.port,
                            apiCertificate: selectedEnvironment.api.certificate,
                            dockerMachine: get(selectedEnvironment, 'docker.machine'),
                            packageJson: packageJson
                          });

                        case 6:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _callee2, this);
                }));

                function _default() {
                  return _default2.apply(this, arguments);
                }

                return _default;
              }()
            });

          case 41:
            if (configuration) {
              _context3.next = 43;
              break;
            }

            throw new Error('Configuration is missing.');

          case 43:
            return _context3.abrupt("return", configuration);

          case 44:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this, [[8, 14]]);
  }));

  return function getConfiguration(_x) {
    return _ref3.apply(this, arguments);
  };
}();

module.exports = getConfiguration;