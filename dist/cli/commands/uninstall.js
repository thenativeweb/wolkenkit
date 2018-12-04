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
    runtimes = require('../../wolkenkit/runtimes'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var uninstall = {
  getOptionDefinitions: function () {
    var _getOptionDefinitions = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      return _regenerator.default.wrap(function _callee$(_context) {
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
              return _context.abrupt("return", [_context.t2, _context.t3]);

            case 7:
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
      var directory, env, help, verbose, version, stopWaiting;
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
                _context2.next = 30;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = {
                header: 'wolkenkit uninstall',
                content: this.description
              };
              _context2.t3 = {
                header: 'Synopsis',
                content: 'wolkenkit uninstall [--version <version>] [--env <env>]'
              };
              _context2.t4 = _toConsumableArray2.default;
              _context2.next = 15;
              return this.getOptionDefinitions();

            case 15:
              _context2.t5 = _context2.sent;
              _context2.t6 = (0, _toConsumableArray2.default)(globalOptionDefinitions);
              _context2.t7 = (0, _context2.t4)(_context2.t5).concat(_context2.t6);
              _context2.t8 = {
                header: 'Options',
                optionList: _context2.t7
              };
              _context2.t9 = "If you don't specify a version, '";
              _context2.next = 22;
              return runtimes.getLatestStableVersion();

            case 22:
              _context2.t10 = _context2.sent;
              _context2.t11 = _context2.t9.concat.call(_context2.t9, _context2.t10, "' will be used as default.");
              _context2.t12 = "If you don't specify an environment, '".concat(processenv('WOLKENKIT_ENV') || defaults.env, "' will be used as default.");
              _context2.t13 = [_context2.t11, _context2.t12];
              _context2.t14 = {
                header: 'Remarks',
                content: _context2.t13
              };
              _context2.t15 = [_context2.t2, _context2.t3, _context2.t8, _context2.t14];
              _context2.t16 = (0, _context2.t1)(_context2.t15);
              return _context2.abrupt("return", _context2.t0.info.call(_context2.t0, _context2.t16));

            case 30:
              buntstift.info("Uninstalling wolkenkit ".concat(version, " on environment ").concat(env, "..."));
              stopWaiting = buntstift.wait();
              _context2.prev = 32;
              _context2.next = 35;
              return wolkenkit.commands.uninstall({
                directory: directory,
                env: env,
                version: version
              }, showProgress(verbose, stopWaiting));

            case 35:
              _context2.next = 42;
              break;

            case 37:
              _context2.prev = 37;
              _context2.t17 = _context2["catch"](32);
              stopWaiting();
              buntstift.error("Failed to uninstall wolkenkit ".concat(version, " on environment ").concat(env, "."));
              throw _context2.t17;

            case 42:
              stopWaiting();
              buntstift.success("Uninstalled wolkenkit ".concat(version, " on environment ").concat(env, "."));

            case 44:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[32, 37]]);
    }));

    return function run(_x) {
      return _run.apply(this, arguments);
    };
  }()
};
module.exports = uninstall;