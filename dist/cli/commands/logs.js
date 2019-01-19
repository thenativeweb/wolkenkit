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

var logs = {
  description: 'Fetch an application log.',
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
              }, {
                name: 'follow',
                type: Boolean,
                defaultValue: defaults.commands.logs.follow,
                description: 'follow log output'
              }]);

            case 1:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
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
      var directory, env, follow, help, verbose, stopWaiting;
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
              if (!(options.follow === undefined)) {
                _context2.next = 6;
                break;
              }

              throw new Error('Follow is missing.');

            case 6:
              directory = process.cwd(), env = options.env, follow = options.follow, help = options.help, verbose = options.verbose;

              if (!help) {
                _context2.next = 24;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = {
                header: 'wolkenkit logs',
                content: this.description
              };
              _context2.t3 = {
                header: 'Synopsis',
                content: 'wolkenkit logs [--env <env>] [--follow]'
              };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray2.default;
              _context2.next = 16;
              return this.getOptionDefinitions();

            case 16:
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

            case 24:
              stopWaiting = buntstift.wait();
              _context2.prev = 25;
              _context2.next = 28;
              return wolkenkit.commands.logs({
                directory: directory,
                env: env,
                follow: follow
              }, showProgress(verbose, stopWaiting));

            case 28:
              _context2.next = 35;
              break;

            case 30:
              _context2.prev = 30;
              _context2.t13 = _context2["catch"](25);
              stopWaiting();
              buntstift.error('Failed to fetch application logs.');
              throw _context2.t13;

            case 35:
              stopWaiting();

            case 36:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[25, 30]]);
    }));

    function run(_x) {
      return _run.apply(this, arguments);
    }

    return run;
  }()
};
module.exports = logs;