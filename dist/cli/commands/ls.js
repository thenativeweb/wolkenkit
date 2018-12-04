'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage'),
    processenv = require('processenv');

var defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var ls = {
  description: 'List supported and installed wolkenkit versions.',
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
      var directory, env, help, verbose, stopWaiting, versions;
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
                _context2.next = 21;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = {
                header: 'wolkenkit ls',
                content: this.description
              };
              _context2.t3 = {
                header: 'Synopsis',
                content: 'wolkenkit ls [--env <env>]'
              };
              _context2.t4 = _toConsumableArray2.default;
              _context2.next = 13;
              return this.getOptionDefinitions();

            case 13:
              _context2.t5 = _context2.sent;
              _context2.t6 = (0, _toConsumableArray2.default)(globalOptionDefinitions);
              _context2.t7 = (0, _context2.t4)(_context2.t5).concat(_context2.t6);
              _context2.t8 = {
                header: 'Options',
                optionList: _context2.t7
              };
              _context2.t9 = {
                header: 'Remarks',
                content: ["If you don't specify an environment, '".concat(processenv('WOLKENKIT_ENV') || defaults.env, "' will be used as default.")]
              };
              _context2.t10 = [_context2.t2, _context2.t3, _context2.t8, _context2.t9];
              _context2.t11 = (0, _context2.t1)(_context2.t10);
              return _context2.abrupt("return", _context2.t0.info.call(_context2.t0, _context2.t11));

            case 21:
              stopWaiting = buntstift.wait();
              _context2.prev = 22;
              _context2.next = 25;
              return wolkenkit.commands.ls({
                directory: directory,
                env: env
              }, showProgress(verbose, stopWaiting));

            case 25:
              versions = _context2.sent;
              _context2.next = 33;
              break;

            case 28:
              _context2.prev = 28;
              _context2.t12 = _context2["catch"](22);
              stopWaiting();
              buntstift.error('Failed to list supported and installed wolkenkit versions.');
              throw _context2.t12;

            case 33:
              stopWaiting();
              buntstift.success("There are ".concat(versions.installed.length, " of ").concat(versions.supported.length, " supported wolkenkit versions installed on environment ").concat(env, "."));

            case 35:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[22, 28]]);
    }));

    return function run(_x) {
      return _run.apply(this, arguments);
    };
  }()
};
module.exports = ls;