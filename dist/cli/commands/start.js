'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2.default)(["\n          wolkenkit start [--port <port>] [--env <env>] [--dangerously-destroy-data] [--shared-key <key>] [--debug]\n          wolkenkit start [--env <env>] [--private-key <file>]"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var buntstift = require('buntstift'),
    eslint = require('eslint'),
    getUsage = require('command-line-usage'),
    processenv = require('processenv'),
    stripIndent = require('common-tags/lib/stripIndent');

var defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var init = {
  description: 'Start an application.',
  getOptionDefinitions: function () {
    var _getOptionDefinitions = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt("return", [{
                name: 'dangerously-destroy-data',
                type: Boolean,
                defaultValue: defaults.commands.start.dangerouslyDestroyData,
                description: 'destroy persistent data'
              }, {
                name: 'debug',
                alias: 'd',
                type: Boolean,
                defaultValue: defaults.commands.start.debug,
                description: 'enable debug mode'
              }, {
                name: 'env',
                alias: 'e',
                type: String,
                defaultValue: processenv('WOLKENKIT_ENV') || defaults.env,
                description: 'select environment',
                typeLabel: '<env>'
              }, {
                // The port has no default value set, as this depends on the
                // application's package.json file, which is not available here.
                name: 'port',
                alias: 'p',
                type: Number,
                description: 'set port',
                typeLabel: '<port>'
              }, {
                name: 'private-key',
                alias: 'k',
                type: String,
                description: 'select private key',
                typeLabel: '<file>'
              }, {
                // The shared key has no default value set, as this varies from call to
                // call, and it makes a difference whether it has been set or not.
                name: 'shared-key',
                alias: 's',
                type: String,
                description: 'set shared key',
                typeLabel: '<key>'
              }]);

            case 1:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function getOptionDefinitions() {
      return _getOptionDefinitions.apply(this, arguments);
    };
  }(),
  run: function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2(options) {
      var directory, debug, env, help, port, verbose, dangerouslyDestroyData, privateKey, sharedKey, stopWaiting, formatter, formattedResult, output;
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
              if (!(options['dangerously-destroy-data'] === undefined)) {
                _context2.next = 4;
                break;
              }

              throw new Error('Dangerously destroy data is missing.');

            case 4:
              if (!(options.debug === undefined)) {
                _context2.next = 6;
                break;
              }

              throw new Error('Debug is missing.');

            case 6:
              if (options.env) {
                _context2.next = 8;
                break;
              }

              throw new Error('Environment is missing.');

            case 8:
              directory = process.cwd(), debug = options.debug, env = options.env, help = options.help, port = options.port, verbose = options.verbose;
              dangerouslyDestroyData = options['dangerously-destroy-data'], privateKey = options['private-key'], sharedKey = options['shared-key'];

              if (!help) {
                _context2.next = 25;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = {
                header: 'wolkenkit start',
                content: this.description
              };
              _context2.t3 = {
                header: 'Synopsis',
                content: stripIndent(_templateObject())
              };
              _context2.t4 = _toConsumableArray2.default;
              _context2.next = 18;
              return this.getOptionDefinitions();

            case 18:
              _context2.t5 = _context2.sent;
              _context2.t6 = (0, _toConsumableArray2.default)(globalOptionDefinitions);
              _context2.t7 = (0, _context2.t4)(_context2.t5).concat(_context2.t6);
              _context2.t8 = {
                header: 'Options',
                optionList: _context2.t7
              };
              _context2.t9 = [_context2.t2, _context2.t3, _context2.t8];
              _context2.t10 = (0, _context2.t1)(_context2.t9);
              return _context2.abrupt("return", _context2.t0.info.call(_context2.t0, _context2.t10));

            case 25:
              buntstift.info('Starting the application...');
              stopWaiting = buntstift.wait();
              _context2.prev = 27;
              _context2.next = 30;
              return wolkenkit.commands.start({
                directory: directory,
                dangerouslyDestroyData: dangerouslyDestroyData,
                debug: debug,
                env: env,
                port: port,
                privateKey: privateKey,
                sharedKey: sharedKey
              }, showProgress(verbose, stopWaiting));

            case 30:
              _context2.next = 50;
              break;

            case 32:
              _context2.prev = 32;
              _context2.t11 = _context2["catch"](27);
              stopWaiting();
              _context2.t12 = _context2.t11.code;
              _context2.next = _context2.t12 === 'ECODEMALFORMED' ? 38 : _context2.t12 === 'ERUNTIMEERROR' ? 44 : 47;
              break;

            case 38:
              formatter = eslint.CLIEngine.getFormatter();
              formattedResult = formatter(_context2.t11.cause.results);
              output = formattedResult.split('\n').slice(0, -2).join('\n');
              buntstift.info(output);
              buntstift.info(_context2.t11.message);
              return _context2.abrupt("break", 48);

            case 44:
              if (_context2.t11.orginalError) {
                buntstift.newLine();
                buntstift.info(_context2.t11.orginalError.stack);
                buntstift.newLine();
              }

              buntstift.info('Application code caused runtime error.');
              return _context2.abrupt("break", 48);

            case 47:
              return _context2.abrupt("break", 48);

            case 48:
              buntstift.error('Failed to start the application.');
              throw _context2.t11;

            case 50:
              stopWaiting();
              buntstift.success('Started the application.');

            case 52:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[27, 32]]);
    }));

    return function run(_x) {
      return _run.apply(this, arguments);
    };
  }()
};
module.exports = init;