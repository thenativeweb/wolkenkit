'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage'),
    processenv = require('processenv');

var defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var health = {
  description: 'Verify whether wolkenkit is setup correctly.',

  getOptionDefinitions: function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt('return', [{
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
      }, _callee, this);
    }));

    function getOptionDefinitions() {
      return _ref.apply(this, arguments);
    }

    return getOptionDefinitions;
  }(),
  run: function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(options) {
      var directory, env, help, verbose, stopWaiting;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (options) {
                _context2.next = 2;
                break;
              }

              throw new Error('Options are missing.');

            case 2:
              if (options.env) {
                _context2.next = 4;
                break;
              }

              throw new Error('Environment is missing.');

            case 4:
              directory = process.cwd(), env = options.env, help = options.help, verbose = options.verbose;

              if (!help) {
                _context2.next = 23;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = { header: 'wolkenkit health', content: this.description };
              _context2.t3 = { header: 'Synopsis', content: 'wolkenkit health [--environment <env>]' };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray3.default;
              _context2.next = 14;
              return this.getOptionDefinitions();

            case 14:
              _context2.t6 = _context2.sent;
              _context2.t7 = (0, _context2.t5)(_context2.t6);
              _context2.t8 = (0, _toConsumableArray3.default)(globalOptionDefinitions);
              _context2.t9 = _context2.t4.concat.call(_context2.t4, _context2.t7, _context2.t8);
              _context2.t10 = {
                header: 'Options',
                optionList: _context2.t9
              };
              _context2.t11 = { header: 'Remarks', content: 'If you don\'t specify an environment, \'' + (processenv('WOLKENKIT_ENV') || defaults.env) + '\' will be used as default.' };
              _context2.t12 = [_context2.t2, _context2.t3, _context2.t10, _context2.t11];
              _context2.t13 = (0, _context2.t1)(_context2.t12);
              return _context2.abrupt('return', _context2.t0.info.call(_context2.t0, _context2.t13));

            case 23:

              buntstift.info('Verifying health on environment ' + env + '...');

              stopWaiting = buntstift.wait();
              _context2.prev = 25;
              _context2.next = 28;
              return wolkenkit.health({ directory: directory, env: env }, showProgress(verbose, stopWaiting));

            case 28:
              _context2.next = 35;
              break;

            case 30:
              _context2.prev = 30;
              _context2.t14 = _context2['catch'](25);

              stopWaiting();
              buntstift.error('Failed to verify health on environment ' + env + '.');

              throw _context2.t14;

            case 35:

              stopWaiting();
              buntstift.success('Verified health on environment ' + env + '.');

            case 37:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[25, 30]]);
    }));

    function run(_x) {
      return _ref2.apply(this, arguments);
    }

    return run;
  }()
};

module.exports = health;