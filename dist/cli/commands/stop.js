'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage'),
    processenv = require('processenv');

var defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var stop = {
  description: 'Stop an application.',

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
                defaultValue: defaults.commands.stop.dangerouslyDestroyData,
                description: 'destroy persistent data'
              }, {
                name: 'env',
                alias: 'e',
                type: String,
                defaultValue: processenv('WOLKENKIT_ENV') || defaults.env,
                description: 'select environment',
                typeLabel: '<env>'
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
      var directory, env, help, verbose, dangerouslyDestroyData, stopWaiting;
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
              if (options.env) {
                _context2.next = 6;
                break;
              }

              throw new Error('Environment is missing.');

            case 6:
              directory = process.cwd(), env = options.env, help = options.help, verbose = options.verbose;
              dangerouslyDestroyData = options['dangerously-destroy-data'];

              if (!help) {
                _context2.next = 25;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = { header: 'wolkenkit stop', content: _this2.description };
              _context2.t3 = { header: 'Synopsis', content: 'wolkenkit stop [--env <env>] [--dangerously-destroy-data]' };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray;
              _context2.next = 17;
              return _this2.getOptionDefinitions();

            case 17:
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

            case 25:

              buntstift.info('Stopping the application...');

              stopWaiting = buntstift.wait();
              _context2.prev = 27;
              _context2.next = 30;
              return wolkenkit.stop({ directory: directory, dangerouslyDestroyData: dangerouslyDestroyData, env: env }, showProgress(verbose, stopWaiting));

            case 30:
              _context2.next = 37;
              break;

            case 32:
              _context2.prev = 32;
              _context2.t13 = _context2['catch'](27);

              stopWaiting();
              buntstift.error('Failed to stop the application.');

              throw _context2.t13;

            case 37:

              stopWaiting();
              buntstift.success('Stopped the application.');

            case 39:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2, [[27, 32]]);
    }))();
  }
};

module.exports = stop;