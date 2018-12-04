'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var path = require('path');

var checkImportDirectory = require('./checkImportDirectory'),
    docker = require('../../../docker'),
    errors = require('../../../errors'),
    health = require('../health'),
    importEventStore = require('./importEventStore'),
    noop = require('../../../noop'),
    runtimes = require('../../runtimes'),
    shared = require('../shared');

var importCommand =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var directory,
        env,
        from,
        toEventStore,
        progress,
        configuration,
        existingContainers,
        version,
        debug,
        persistData,
        sharedKey,
        containers,
        importDirectory,
        _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = _ref.directory, env = _ref.env, from = _ref.from, toEventStore = _ref.toEventStore;
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (from) {
              _context.next = 8;
              break;
            }

            throw new Error('From is missing.');

          case 8:
            if (!(toEventStore === undefined)) {
              _context.next = 10;
              break;
            }

            throw new Error('To event store is missing.');

          case 10:
            _context.next = 12;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: false
            }, progress);

          case 12:
            configuration = _context.sent;
            _context.next = 15;
            return shared.checkDocker({
              configuration: configuration,
              env: env
            }, progress);

          case 15:
            progress({
              message: "Verifying health on environment ".concat(env, "..."),
              type: 'info'
            });
            _context.next = 18;
            return health({
              directory: directory,
              env: env
            }, progress);

          case 18:
            progress({
              message: 'Verifying application status...',
              type: 'info'
            });
            _context.next = 21;
            return docker.getContainers({
              configuration: configuration,
              env: env,
              where: {
                label: {
                  'wolkenkit-application': configuration.application
                }
              }
            });

          case 21:
            existingContainers = _context.sent;

            if (!(existingContainers.length === 0)) {
              _context.next = 25;
              break;
            }

            progress({
              message: "The application is not running.",
              type: 'info'
            });
            throw new errors.ApplicationNotRunning();

          case 25:
            version = configuration.runtime.version;
            debug = existingContainers[0].labels['wolkenkit-debug'] === 'true', persistData = existingContainers[0].labels['wolkenkit-persist-data'] === 'true', sharedKey = existingContainers[0].labels['wolkenkit-shared-key'];
            _context.next = 29;
            return runtimes.getContainers({
              forVersion: version,
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            });

          case 29:
            containers = _context.sent;

            if (!(existingContainers.length < containers.length)) {
              _context.next = 33;
              break;
            }

            progress({
              message: "The application is partially running.",
              type: 'info'
            });
            throw new errors.ApplicationPartiallyRunning();

          case 33:
            importDirectory = path.isAbsolute(from) ? from : path.join(directory, from);
            _context.next = 36;
            return checkImportDirectory({
              importDirectory: importDirectory,
              toEventStore: toEventStore
            }, progress);

          case 36:
            if (!toEventStore) {
              _context.next = 39;
              break;
            }

            _context.next = 39;
            return importEventStore({
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              containers: containers,
              importDirectory: importDirectory
            }, progress);

          case 39:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function importCommand(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = importCommand;