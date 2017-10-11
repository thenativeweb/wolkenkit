'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var buntstift = require('buntstift'),
    eslint = require('eslint'),
    getUsage = require('command-line-usage'),
    processenv = require('processenv');

var defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var init = {
  description: 'Start an application.',

  getOptionDefinitions: function getOptionDefinitions() {
    var _this = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt('return', [{
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
                // The shared key has no default value set, as this varies from call to
                // call, and it makes a difference whether it has been set or not.
                name: 'shared-key',
                alias: 's',
                type: String,
                description: 'set shared key',
                typeLabel: '<key>'
              }]);

            case 1:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  },
  run: function run(options) {
    var _this2 = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var directory, debug, env, help, port, verbose, dangerouslyDestroyData, sharedKey, stopWaiting, formatter, formattedResult, output;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
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
              dangerouslyDestroyData = options['dangerously-destroy-data'], sharedKey = options['shared-key'];

              if (!help) {
                _context2.next = 27;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = { header: 'wolkenkit start', content: _this2.description };
              _context2.t3 = { header: 'Synopsis', content: 'wolkenkit start [--port <port>] [--env <env>] [--dangerously-destroy-data] [--shared-key <key>] [--debug]' };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray;
              _context2.next = 19;
              return _this2.getOptionDefinitions();

            case 19:
              _context2.t6 = _context2.sent;
              _context2.t7 = (0, _context2.t5)(_context2.t6);
              _context2.t8 = _toConsumableArray(globalOptionDefinitions);
              _context2.t9 = _context2.t4.concat.call(_context2.t4, _context2.t7, _context2.t8);
              _context2.t10 = {
                header: 'Options',
                optionList: _context2.t9
              };
              _context2.t11 = [_context2.t2, _context2.t3, _context2.t10];
              _context2.t12 = (0, _context2.t1)(_context2.t11);
              return _context2.abrupt('return', _context2.t0.info.call(_context2.t0, _context2.t12));

            case 27:

              buntstift.info('Starting the application...');

              stopWaiting = buntstift.wait();
              _context2.prev = 29;
              _context2.next = 32;
              return wolkenkit.start({ directory: directory, dangerouslyDestroyData: dangerouslyDestroyData, debug: debug, env: env, port: port, sharedKey: sharedKey }, showProgress(verbose, stopWaiting));

            case 32:
              _context2.next = 40;
              break;

            case 34:
              _context2.prev = 34;
              _context2.t13 = _context2['catch'](29);

              stopWaiting();

              if (_context2.t13.code === 'ECODEMALFORMED') {
                formatter = eslint.CLIEngine.getFormatter();
                formattedResult = formatter(_context2.t13.cause.results);
                output = formattedResult.split('\n').slice(0, -2).join('\n');


                buntstift.info(output);
                buntstift.info(_context2.t13.message);
              }

              buntstift.error('Failed to start the application.');

              throw _context2.t13;

            case 40:

              stopWaiting();
              buntstift.success('Started the application.');

            case 42:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2, [[29, 34]]);
    }))();
  }
};

module.exports = init;