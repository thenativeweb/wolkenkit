'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var defaults = require('./defaults.json'),
    runtimes = require('./runtimes');

var Configuration =
/*#__PURE__*/
function () {
  function Configuration(_ref) {
    var type = _ref.type,
        environment = _ref.environment,
        applicationName = _ref.applicationName,
        runtimeVersion = _ref.runtimeVersion,
        packageJson = _ref.packageJson,
        _ref$apiHostname = _ref.apiHostname,
        apiHostname = _ref$apiHostname === void 0 ? undefined : _ref$apiHostname,
        _ref$apiCertificate = _ref.apiCertificate,
        apiCertificate = _ref$apiCertificate === void 0 ? undefined : _ref$apiCertificate,
        _ref$apiPort = _ref.apiPort,
        apiPort = _ref$apiPort === void 0 ? undefined : _ref$apiPort,
        _ref$dockerMachine = _ref.dockerMachine,
        dockerMachine = _ref$dockerMachine === void 0 ? undefined : _ref$dockerMachine;
    (0, _classCallCheck2.default)(this, Configuration);

    if (!type) {
      throw new Error('Type is missing.');
    }

    if (!environment) {
      throw new Error('Environment is missing.');
    }

    if (!applicationName) {
      throw new Error('Application name is missing.');
    }

    if (!runtimeVersion) {
      throw new Error('Runtime version is missing.');
    }

    if (!packageJson) {
      throw new Error('Package json is missing.');
    }

    this.type = type;
    this.environment = environment;
    this.application = {
      name: applicationName,
      runtime: {
        version: runtimeVersion
      }
    };
    this.api = {
      host: {
        name: apiHostname || defaults.commands.shared.api.host.name,
        certificate: apiCertificate
      },
      port: apiPort || defaults.commands.shared.api.port
    };
    this.packageJson = packageJson;

    if (dockerMachine) {
      this.docker = {
        machine: dockerMachine
      };
    }
  }

  (0, _createClass2.default)(Configuration, [{
    key: "containers",
    value: function () {
      var _containers = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(_ref2) {
        var dangerouslyExposeHttpPorts, debug, persistData, sharedKey, containers;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                dangerouslyExposeHttpPorts = _ref2.dangerouslyExposeHttpPorts, debug = _ref2.debug, persistData = _ref2.persistData, sharedKey = _ref2.sharedKey;

                if (!(dangerouslyExposeHttpPorts === undefined)) {
                  _context.next = 3;
                  break;
                }

                throw new Error('Dangerously expose http ports is missing.');

              case 3:
                if (!(debug === undefined)) {
                  _context.next = 5;
                  break;
                }

                throw new Error('Debug is missing.');

              case 5:
                if (!(persistData === undefined)) {
                  _context.next = 7;
                  break;
                }

                throw new Error('Persist data is missing.');

              case 7:
                if (sharedKey) {
                  _context.next = 9;
                  break;
                }

                throw new Error('Shared key is missing.');

              case 9:
                _context.next = 11;
                return runtimes.getContainers({
                  configuration: this,
                  dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
                  debug: debug,
                  forVersion: this.application.runtime.version,
                  persistData: persistData,
                  sharedKey: sharedKey
                });

              case 11:
                containers = _context.sent;
                return _context.abrupt("return", containers);

              case 13:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function containers(_x) {
        return _containers.apply(this, arguments);
      }

      return containers;
    }()
  }]);
  return Configuration;
}();

module.exports = Configuration;