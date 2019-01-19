'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var path = require('path');

var Value = require('validate-value');

var errors = require('../../errors'),
    file = require('../../file'),
    resolveSecrets = require('./resolveSecrets'),
    transformEnvironmentVariables = require('./transformEnvironmentVariables');

var getConfiguration =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var directory, configurationFile, packageJson, configuration, runtimeVersion, schema, value;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = _ref.directory;

            if (directory) {
              _context.next = 3;
              break;
            }

            throw new Error('Directory is missing.');

          case 3:
            configurationFile = path.join(directory, 'package.json');
            _context.next = 6;
            return file.readJson(configurationFile);

          case 6:
            packageJson = _context.sent;
            configuration = packageJson.wolkenkit;

            if (configuration) {
              _context.next = 10;
              break;
            }

            throw new errors.ConfigurationNotFound();

          case 10:
            _context.next = 12;
            return resolveSecrets({
              configuration: configuration,
              directory: directory
            });

          case 12:
            configuration = _context.sent;
            _context.prev = 13;
            runtimeVersion = configuration.runtime.version;
            _context.next = 20;
            break;

          case 17:
            _context.prev = 17;
            _context.t0 = _context["catch"](13);
            throw new errors.ConfigurationMalformed();

          case 20:
            _context.prev = 20;

            /* eslint-disable global-require */
            schema = require("../../configuration/".concat(runtimeVersion, "/schema"))();
            /* eslint-enable global-require */

            _context.next = 31;
            break;

          case 24:
            _context.prev = 24;
            _context.t1 = _context["catch"](20);
            _context.t2 = _context.t1.code;
            _context.next = _context.t2 === 'MODULE_NOT_FOUND' ? 29 : 30;
            break;

          case 29:
            throw new errors.VersionNotFound();

          case 30:
            throw _context.t1;

          case 31:
            value = new Value(schema);
            _context.prev = 32;
            value.validate(configuration, 'wolkenkit');
            _context.next = 39;
            break;

          case 36:
            _context.prev = 36;
            _context.t3 = _context["catch"](32);
            throw new errors.ConfigurationMalformed(_context.t3.message);

          case 39:
            Object.keys(configuration.environments).forEach(function (name) {
              var currentEnvironment = configuration.environments[name];
              var environmentVariables = currentEnvironment.environmentVariables;

              if (!environmentVariables) {
                return;
              }

              configuration.environments[name].environmentVariables = transformEnvironmentVariables({
                environmentVariables: environmentVariables
              });
            });
            return _context.abrupt("return", configuration);

          case 41:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[13, 17], [20, 24], [32, 36]]);
  }));

  return function getConfiguration(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getConfiguration;