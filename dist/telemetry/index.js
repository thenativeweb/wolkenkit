'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs'),
    os = require('os'),
    path = require('path');

var buntstift = require('buntstift'),
    _require = require('commands-events'),
    Command = _require.Command,
    deepHash = require('deep-hash'),
    dotFile = require('dotfile-json'),
    promisify = require('util.promisify'),
    request = require('requestretry'),
    semver = require('semver'),
    stringifyObject = require('stringify-object'),
    uuid = require('uuidv4');


var getConfiguration = require('../application/getConfiguration'),
    packageJson = require('../../package.json');

var stat = promisify(fs.stat);

var telemetry = {
  fileName: '.wolkenkit',

  allowedCommands: {
    reload: { event: 'reloaded' },
    restart: { event: 'restarted' },
    start: { event: 'started' },
    stop: { event: 'stopped' }
  },

  init: function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      var version, homeDirectory, stats, hasChanges, data, latestVersion, no, yes, answer, confirmed;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              version = packageJson.version;
              homeDirectory = os.homedir();
              _context.prev = 2;
              _context.next = 5;
              return stat(path.join(homeDirectory, this.fileName));

            case 5:
              stats = _context.sent;

              if (!stats.isDirectory()) {
                _context.next = 9;
                break;
              }

              buntstift.error('Please delete the .wolkenkit directory in your home directory, as this is a relic of the wolkenkit beta.');

              return _context.abrupt('return', buntstift.exit(1));

            case 9:
              _context.next = 15;
              break;

            case 11:
              _context.prev = 11;
              _context.t0 = _context['catch'](2);

              if (!(_context.t0.code !== 'ENOENT')) {
                _context.next = 15;
                break;
              }

              throw _context.t0;

            case 15:
              hasChanges = false;
              _context.next = 18;
              return dotFile.read(this.fileName);

            case 18:
              data = _context.sent;


              if (!data.installationId) {
                data.installationId = uuid();

                hasChanges = true;
              }
              if (!data.versions) {
                data.versions = {};

                hasChanges = true;
              }

              if (data.versions[version]) {
                _context.next = 49;
                break;
              }

              latestVersion = (0, _keys2.default)(data.versions).sort(function (version1, version2) {
                return !semver.gt(version1, version2);
              })[0];

              if (!(!latestVersion || latestVersion && !data.versions[latestVersion].sendTelemetry)) {
                _context.next = 48;
                break;
              }

              buntstift.newLine();
              buntstift.success('Welcome to wolkenkit!');
              buntstift.newLine();
              buntstift.info('wolkenkit is a free open source project that is continuously being developed');
              buntstift.info('by the native web.');
              buntstift.newLine();
              buntstift.info('We would be very thankful if you could share a few data about your use of the');
              buntstift.info('wolkenkit CLI with us, as it helps us to improve wolkenkit. Since we respect');
              buntstift.info('your privacy, this data is strictly anonymous and does not contain any data');
              buntstift.info('on your application or your users.');
              buntstift.newLine();
              buntstift.info('You can view and revise your decision at any time using the CLI\'s telemetry');
              buntstift.info('command. Not sharing your data will not result in any disadvantages for you.');
              buntstift.info('For details, see https://www.thenativeweb.io/telemetry');
              buntstift.newLine();

              no = 'No, thanks.';
              yes = 'Yes, I agree to share anonymous usage data with the native web.';
              _context.next = 43;
              return buntstift.select('Do you agree to share anonymous usage data with the native web?', [no, yes]);

            case 43:
              answer = _context.sent;
              confirmed = answer === yes;


              buntstift.newLine();

              data.versions[version] = { sendTelemetry: confirmed };

              hasChanges = true;

            case 48:

              if (latestVersion && data.versions[latestVersion].sendTelemetry) {
                data.versions[version] = { sendTelemetry: true };

                hasChanges = true;
              }

            case 49:
              if (!hasChanges) {
                _context.next = 52;
                break;
              }

              _context.next = 52;
              return dotFile.write(this.fileName, data);

            case 52:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[2, 11]]);
    }));

    function init() {
      return _ref.apply(this, arguments);
    }

    return init;
  }(),
  isEnabled: function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      var version, data;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              version = packageJson.version;
              _context2.next = 3;
              return dotFile.read(this.fileName);

            case 3:
              data = _context2.sent;
              return _context2.abrupt('return', Boolean(data.versions[version].sendTelemetry));

            case 5:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function isEnabled() {
      return _ref2.apply(this, arguments);
    }

    return isEnabled;
  }(),
  enable: function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
      var version, data;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              version = packageJson.version;
              _context3.next = 3;
              return dotFile.read(this.fileName);

            case 3:
              data = _context3.sent;


              data.versions[version].sendTelemetry = true;

              _context3.next = 7;
              return dotFile.write(this.fileName, data);

            case 7:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function enable() {
      return _ref3.apply(this, arguments);
    }

    return enable;
  }(),
  disable: function () {
    var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
      var version, data;
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              version = packageJson.version;
              _context4.next = 3;
              return dotFile.read(this.fileName);

            case 3:
              data = _context4.sent;


              data.versions[version].sendTelemetry = false;

              _context4.next = 7;
              return dotFile.write(this.fileName, data);

            case 7:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function disable() {
      return _ref4.apply(this, arguments);
    }

    return disable;
  }(),
  send: function () {
    var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(options) {
      var command, args, version, help, env, data, configuration, application, runtime, installationId, timestamp, telemetryData, stringifiedTelemetryData;
      return _regenerator2.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              if (options) {
                _context5.next = 2;
                break;
              }

              throw new Error('Options are missing.');

            case 2:
              if (options.command) {
                _context5.next = 4;
                break;
              }

              throw new Error('Command name is missing.');

            case 4:
              if (options.args) {
                _context5.next = 6;
                break;
              }

              throw new Error('Arguments are missing.');

            case 6:
              command = options.command, args = options.args;
              version = packageJson.version;
              help = args.help, env = args.env;

              // If a command was called with the --help flag, abort.

              if (!help) {
                _context5.next = 11;
                break;
              }

              return _context5.abrupt('return');

            case 11:
              _context5.next = 13;
              return dotFile.read(this.fileName);

            case 13:
              data = _context5.sent;

              if (data.versions[version].sendTelemetry) {
                _context5.next = 16;
                break;
              }

              return _context5.abrupt('return');

            case 16:
              if (this.allowedCommands[command]) {
                _context5.next = 18;
                break;
              }

              return _context5.abrupt('return');

            case 18:

              buntstift.verbose('Sending telemetry data...');

              _context5.prev = 19;
              _context5.next = 22;
              return getConfiguration({ directory: process.cwd() });

            case 22:
              configuration = _context5.sent;
              application = configuration.application, runtime = configuration.runtime;
              installationId = data.installationId;
              timestamp = Date.now();

              // Anonymize any data that are related to the user, the machine or the
              // application.

              telemetryData = deepHash({
                installationId: installationId,
                application: {
                  name: application,
                  env: env
                }
              }, installationId);

              // Add some non-anonymized data that do not refer to the user, the machine
              // or the application.

              telemetryData.timestamp = timestamp;
              telemetryData.cli = { version: version, command: command };
              telemetryData.runtime = runtime;

              stringifiedTelemetryData = stringifyObject(telemetryData, {
                indent: '  ',
                singleQuotes: true
              }).split('\n');


              stringifiedTelemetryData.forEach(function (line) {
                buntstift.verbose(line);
              });

              _context5.next = 34;
              return request({
                method: 'POST',
                url: 'https://telemetry.wolkenkit.io/v1/command',
                json: true,
                body: new Command({
                  context: { name: 'collecting' },
                  aggregate: { name: 'application', id: uuid.fromString(telemetryData.installationId) },
                  name: 'recordEvent',
                  data: {
                    name: this.allowedCommands[command].event,
                    data: telemetryData
                  }
                }),
                fullResponse: false,
                maxAttempts: 3,
                retryDelay: 2 * 1000,
                retryStrategy: request.RetryStrategies.HTTPOrNetworkError
              });

            case 34:
              _context5.next = 41;
              break;

            case 36:
              _context5.prev = 36;
              _context5.t0 = _context5['catch'](19);

              buntstift.verbose('Failed to send telemetry data.');
              buntstift.verbose(_context5.t0.message);

              return _context5.abrupt('return');

            case 41:

              buntstift.verbose('Telemetry data sent.');

            case 42:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, this, [[19, 36]]);
    }));

    function send(_x) {
      return _ref5.apply(this, arguments);
    }

    return send;
  }()
};

module.exports = telemetry;