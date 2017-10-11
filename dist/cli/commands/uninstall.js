'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage'),
    processenv = require('processenv');

var defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    runtimes = require('../../wolkenkit/runtimes'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var uninstall = {
  getOptionDefinitions: function getOptionDefinitions() {
    var _this = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.t0 = String;
              _context.next = 3;
              return runtimes.getLatestStableVersion();

            case 3:
              _context.t1 = _context.sent;
              _context.t2 = {
                name: 'version',
                alias: 'v',
                type: _context.t0,
                defaultValue: _context.t1,
                description: 'version to uninstall',
                typeLabel: '<version>'
              };
              _context.t3 = {
                name: 'env',
                alias: 'e',
                type: String,
                defaultValue: processenv('WOLKENKIT_ENV') || defaults.env,
                description: 'select environment',
                typeLabel: '<env>'
              };
              return _context.abrupt('return', [_context.t2, _context.t3]);

            case 7:
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
      var directory, env, help, verbose, version, stopWaiting;
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
              if (options.version) {
                _context2.next = 4;
                break;
              }

              throw new Error('Version is missing.');

            case 4:
              if (options.env) {
                _context2.next = 6;
                break;
              }

              throw new Error('Environment is missing.');

            case 6:
              directory = process.cwd(), env = options.env, help = options.help, verbose = options.verbose, version = options.version;

              if (!help) {
                _context2.next = 32;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = { header: 'wolkenkit uninstall', content: _this2.description };
              _context2.t3 = { header: 'Synopsis', content: 'wolkenkit uninstall [--version <version>] [--env <env>]' };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray;
              _context2.next = 16;
              return _this2.getOptionDefinitions();

            case 16:
              _context2.t6 = _context2.sent;
              _context2.t7 = (0, _context2.t5)(_context2.t6);
              _context2.t8 = _toConsumableArray(globalOptionDefinitions);
              _context2.t9 = _context2.t4.concat.call(_context2.t4, _context2.t7, _context2.t8);
              _context2.t10 = {
                header: 'Options',
                optionList: _context2.t9
              };
              _context2.next = 23;
              return runtimes.getLatestStableVersion();

            case 23:
              _context2.t11 = _context2.sent;
              _context2.t12 = 'If you don\'t specify a version, \'' + _context2.t11;
              _context2.t13 = _context2.t12 + '\' will be used as default.';
              _context2.t14 = 'If you don\'t specify an environment, \'' + (processenv('WOLKENKIT_ENV') || defaults.env) + '\' will be used as default.';
              _context2.t15 = [_context2.t13, _context2.t14];
              _context2.t16 = {
                header: 'Remarks',
                content: _context2.t15
              };
              _context2.t17 = [_context2.t2, _context2.t3, _context2.t10, _context2.t16];
              _context2.t18 = (0, _context2.t1)(_context2.t17);
              return _context2.abrupt('return', _context2.t0.info.call(_context2.t0, _context2.t18));

            case 32:

              buntstift.info('Uninstalling wolkenkit ' + version + ' on environment ' + env + '...');

              stopWaiting = buntstift.wait();
              _context2.prev = 34;
              _context2.next = 37;
              return wolkenkit.uninstall({ directory: directory, env: env, version: version }, showProgress(verbose, stopWaiting));

            case 37:
              _context2.next = 44;
              break;

            case 39:
              _context2.prev = 39;
              _context2.t19 = _context2['catch'](34);

              stopWaiting();
              buntstift.error('Failed to uninstall wolkenkit ' + version + ' on environment ' + env + '.');

              throw _context2.t19;

            case 44:

              stopWaiting();
              buntstift.success('Uninstalled wolkenkit ' + version + ' on environment ' + env + '.');

            case 46:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2, [[34, 39]]);
    }))();
  }
};

module.exports = uninstall;