'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var buntstift = require('buntstift'),
    eslint = require('eslint'),
    getUsage = require('command-line-usage'),
    processenv = require('processenv');

var defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var reload = {
  description: 'Reload an application.',
  getOptionDefinitions: function () {
    var _getOptionDefinitions = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt("return", [{
                name: 'env',
                alias: 'e',
                type: String,
                defaultValue: processenv('WOLKENKIT_ENV') || defaults.env,
                description: 'select environment',
                typeLabel: '<env>'
              }]);

            case 1:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    function getOptionDefinitions() {
      return _getOptionDefinitions.apply(this, arguments);
    }

    return getOptionDefinitions;
  }(),
  run: function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2(options) {
      var directory, env, help, verbose, stopWaiting, formatter, formattedResult, output;
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
              if (options.env) {
                _context2.next = 4;
                break;
              }

              throw new Error('Environment is missing.');

            case 4:
              directory = process.cwd(), env = options.env, help = options.help, verbose = options.verbose;

              if (!help) {
                _context2.next = 22;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = {
                header: 'wolkenkit reload',
                content: this.description
              };
              _context2.t3 = {
                header: 'Synopsis',
                content: 'wolkenkit reload [--env <env>]'
              };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray2.default;
              _context2.next = 14;
              return this.getOptionDefinitions();

            case 14:
              _context2.t6 = _context2.sent;
              _context2.t7 = (0, _context2.t5)(_context2.t6);
              _context2.t8 = (0, _toConsumableArray2.default)(globalOptionDefinitions);
              _context2.t9 = _context2.t4.concat.call(_context2.t4, _context2.t7, _context2.t8);
              _context2.t10 = {
                header: 'Options',
                optionList: _context2.t9
              };
              _context2.t11 = [_context2.t2, _context2.t3, _context2.t10];
              _context2.t12 = (0, _context2.t1)(_context2.t11);
              return _context2.abrupt("return", _context2.t0.info.call(_context2.t0, _context2.t12));

            case 22:
              buntstift.info('Reloading the application...');
              stopWaiting = buntstift.wait();
              _context2.prev = 24;
              _context2.next = 27;
              return wolkenkit.commands.reload({
                directory: directory,
                env: env
              }, showProgress(verbose, stopWaiting));

            case 27:
              _context2.next = 46;
              break;

            case 29:
              _context2.prev = 29;
              _context2.t13 = _context2["catch"](24);
              stopWaiting();
              _context2.t14 = _context2.t13.code;
              _context2.next = _context2.t14 === 'ECONFIGURATIONMALFORMED' ? 35 : _context2.t14 === 'ECODEMALFORMED' ? 37 : 43;
              break;

            case 35:
              if (_context2.t13.message === 'Missing required property: certificate (at wolkenkit.environments.default.api.certificate).') {
                buntstift.error('Certificate is missing.');
                buntstift.warn('Due to a security issue in wolkenkit, the built-in certificate for local.wolkenkit.ui is no longer supported. Please provide a custom certificate.');
                buntstift.warn('For details see https://docs.wolkenkit.io/3.1.0/reference/configuring-an-application/using-custom-certificates/');
              }

              throw _context2.t13;

            case 37:
              formatter = eslint.CLIEngine.getFormatter();
              formattedResult = formatter(_context2.t13.cause.results);
              output = formattedResult.split('\n').slice(0, -2).join('\n');
              buntstift.info(output);
              buntstift.info(_context2.t13.message);
              return _context2.abrupt("break", 44);

            case 43:
              return _context2.abrupt("break", 44);

            case 44:
              buntstift.error('Failed to reload the application.');
              throw _context2.t13;

            case 46:
              stopWaiting();
              buntstift.success('Reloaded the application.');

            case 48:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[24, 29]]);
    }));

    function run(_x) {
      return _run.apply(this, arguments);
    }

    return run;
  }()
};
module.exports = reload;