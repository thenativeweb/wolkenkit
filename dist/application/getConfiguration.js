'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var path = require('path');

var Value = require('validate-value');

var errors = require('../errors'),
    file = require('../file'),
    resolveSecrets = require('./resolveSecrets'),
    transformEnvironmentVariables = require('./transformEnvironmentVariables');

var getConfiguration =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var directory, configurationFile, packageJson, configuration, runtimeVersion, schema, value;
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
            if (options.directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            directory = options.directory;
            configurationFile = path.join(directory, 'package.json');
            _context.next = 8;
            return file.readJson(configurationFile);

          case 8:
            packageJson = _context.sent;
            configuration = packageJson.wolkenkit;

            if (configuration) {
              _context.next = 12;
              break;
            }

            throw new errors.ConfigurationNotFound();

          case 12:
            _context.next = 14;
            return resolveSecrets({
              configuration: configuration,
              directory: directory
            });

          case 14:
            configuration = _context.sent;
            _context.prev = 15;
            runtimeVersion = configuration.runtime.version;
            _context.next = 22;
            break;

          case 19:
            _context.prev = 19;
            _context.t0 = _context["catch"](15);
            throw new errors.ConfigurationMalformed();

          case 22:
            _context.prev = 22;

            /* eslint-disable global-require */
            schema = require("../configuration/".concat(runtimeVersion, "/schema"))();
            /* eslint-enable global-require */

            _context.next = 33;
            break;

          case 26:
            _context.prev = 26;
            _context.t1 = _context["catch"](22);
            _context.t2 = _context.t1.code;
            _context.next = _context.t2 === 'MODULE_NOT_FOUND' ? 31 : 32;
            break;

          case 31:
            throw new errors.VersionNotFound();

          case 32:
            throw _context.t1;

          case 33:
            value = new Value(schema);
            _context.prev = 34;
            value.validate(configuration, 'wolkenkit');
            _context.next = 41;
            break;

          case 38:
            _context.prev = 38;
            _context.t3 = _context["catch"](34);
            throw new errors.ConfigurationMalformed(_context.t3.message);

          case 41:
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

          case 43:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[15, 19], [22, 26], [34, 38]]);
  }));

  return function getConfiguration(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getConfiguration;