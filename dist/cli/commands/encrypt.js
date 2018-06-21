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

var defaults = require('../defaults'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var encrypt = {
  description: 'Encrypt the given value.',

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
              }, {
                name: 'private-key',
                alias: 'k',
                type: String,
                description: 'select private key',
                typeLabel: '<file>'
              }, {
                name: 'value',
                alias: 'v',
                type: String,
                description: 'select value',
                typeLabel: '<value>'
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
      var directory, env, help, value, verbose, privateKey, stopWaiting, encrypted;
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
              directory = process.cwd(), env = options.env, help = options.help, value = options.value, verbose = options.verbose, privateKey = options['private-key'];

              if (!help) {
                _context2.next = 22;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = { header: 'wolkenkit encrypt', content: this.description };
              _context2.t3 = { header: 'Synopsis', content: 'wolkenkit encrypt [--value <value>] [--env <env>] [--private-key <file>]' };
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
              _context2.t11 = [_context2.t2, _context2.t3, _context2.t10];
              _context2.t12 = (0, _context2.t1)(_context2.t11);
              return _context2.abrupt('return', _context2.t0.info.call(_context2.t0, _context2.t12));

            case 22:

              buntstift.info('Encrypting...');

              if (options.value) {
                _context2.next = 26;
                break;
              }

              buntstift.error('Value is missing.');

              throw new Error('Value is missing.');

            case 26:
              stopWaiting = buntstift.wait();
              encrypted = void 0;
              _context2.prev = 28;
              _context2.next = 31;
              return wolkenkit.commands.encrypt({ env: env, directory: directory, privateKey: privateKey, value: value }, showProgress(verbose, stopWaiting));

            case 31:
              encrypted = _context2.sent;
              _context2.next = 39;
              break;

            case 34:
              _context2.prev = 34;
              _context2.t13 = _context2['catch'](28);

              stopWaiting();
              buntstift.error('Failed to encrypt.');

              throw _context2.t13;

            case 39:

              stopWaiting();
              buntstift.success('Value: ' + encrypted);

            case 41:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[28, 34]]);
    }));

    function run(_x) {
      return _ref2.apply(this, arguments);
    }

    return run;
  }()
};

module.exports = encrypt;