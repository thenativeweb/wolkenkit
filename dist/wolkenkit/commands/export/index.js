'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs'),
    path = require('path');

var promisify = require('util.promisify');

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    exportEventStore = require('./exportEventStore'),
    health = require('../health'),
    noop = require('../../../noop'),
    runtimes = require('../../runtimes'),
    shared = require('../shared'),
    shell = require('../../../shell');

var readdir = promisify(fs.readdir);

var exportCommand =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var directory,
        env,
        to,
        fromEventStore,
        progress,
        configuration,
        existingContainers,
        version,
        debug,
        persistData,
        sharedKey,
        containers,
        exportDirectory,
        entries,
        _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = _ref.directory, env = _ref.env, to = _ref.to, fromEventStore = _ref.fromEventStore;
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
            if (to) {
              _context.next = 8;
              break;
            }

            throw new Error('To is missing.');

          case 8:
            if (!(fromEventStore === undefined)) {
              _context.next = 10;
              break;
            }

            throw new Error('From event store is missing.');

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
            exportDirectory = path.isAbsolute(to) ? to : path.join(directory, to);
            _context.next = 36;
            return shell.mkdir('-p', exportDirectory);

          case 36:
            _context.next = 38;
            return readdir(exportDirectory);

          case 38:
            entries = _context.sent;

            if (!(entries.length > 0)) {
              _context.next = 42;
              break;
            }

            progress({
              message: 'The export directory is not empty.',
              type: 'info'
            });
            throw new errors.DirectoryNotEmpty();

          case 42:
            if (!fromEventStore) {
              _context.next = 45;
              break;
            }

            _context.next = 45;
            return exportEventStore({
              configuration: configuration,
              env: env,
              containers: containers,
              sharedKey: sharedKey,
              exportDirectory: exportDirectory
            }, progress);

          case 45:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function exportCommand(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = exportCommand;