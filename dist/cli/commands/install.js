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

var install = {
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
                description: 'version to install',
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

    function getOptionDefinitions() {
      return _getOptionDefinitions.apply(this, arguments);
    }

    return getOptionDefinitions;
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
                _context2.next = 32;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = {
                header: 'wolkenkit install',
                content: this.description
              };
              _context2.t3 = {
                header: 'Synopsis',
                content: 'wolkenkit install [--version <version>] [--env <env>]'
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
              _context2.t11 = "If you don't specify a version, '";
              _context2.next = 24;
              return runtimes.getLatestStableVersion();

            case 24:
              _context2.t12 = _context2.sent;
              _context2.t13 = _context2.t11.concat.call(_context2.t11, _context2.t12, "' will be used as default.");
              _context2.t14 = "If you don't specify an environment, '".concat(processenv('WOLKENKIT_ENV') || defaults.env, "' will be used as default.");
              _context2.t15 = [_context2.t13, _context2.t14];
              _context2.t16 = {
                header: 'Remarks',
                content: _context2.t15
              };
              _context2.t17 = [_context2.t2, _context2.t3, _context2.t10, _context2.t16];
              _context2.t18 = (0, _context2.t1)(_context2.t17);
              return _context2.abrupt("return", _context2.t0.info.call(_context2.t0, _context2.t18));

            case 32:
              buntstift.info("Installing wolkenkit ".concat(version, " on environment ").concat(env, "..."));
              stopWaiting = buntstift.wait();
              _context2.prev = 34;
              _context2.next = 37;
              return wolkenkit.commands.install({
                directory: directory,
                env: env,
                version: version
              }, showProgress(verbose, stopWaiting));

            case 37:
              _context2.next = 44;
              break;

            case 39:
              _context2.prev = 39;
              _context2.t19 = _context2["catch"](34);
              stopWaiting();
              buntstift.error("Failed to install wolkenkit ".concat(version, " on environment ").concat(env, "."));
              throw _context2.t19;

            case 44:
              stopWaiting();
              buntstift.success("Installed wolkenkit ".concat(version, " on environment ").concat(env, "."));

            case 46:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[34, 39]]);
    }));

    function run(_x) {
      return _run.apply(this, arguments);
    }

    return run;
  }()
};
module.exports = install;