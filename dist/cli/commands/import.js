'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2.default)(["\n          wolkenkit import [--env <env>] --from=<directory> [--to-event-store]"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage'),
    processenv = require('processenv'),
    stripIndent = require('common-tags/lib/stripIndent');

var defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var importCommand = {
  description: 'Import application data.',
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
                name: 'from',
                alias: 'f',
                type: String,
                description: 'set the directory to export to',
                typeLabel: '<directory>'
              }, {
                name: 'to-event-store',
                type: Boolean,
                defaultValue: defaults.commands.import.toEventStore,
                description: 'import the event store'
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
      var directory, env, from, help, verbose, toEventStore, stopWaiting;
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
              if (!(options['to-event-store'] === undefined)) {
                _context2.next = 6;
                break;
              }

              throw new Error('To event store is missing.');

            case 6:
              directory = process.cwd(), env = options.env, from = options.from, help = options.help, verbose = options.verbose;
              toEventStore = options['to-event-store'];

              if (!help) {
                _context2.next = 25;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = {
                header: 'wolkenkit import',
                content: this.description
              };
              _context2.t3 = {
                header: 'Synopsis',
                content: stripIndent(_templateObject())
              };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray2.default;
              _context2.next = 17;
              return this.getOptionDefinitions();

            case 17:
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

            case 25:
              if (from) {
                _context2.next = 28;
                break;
              }

              buntstift.error('The --from option is missing.');
              throw new Error('The --from option is missing.');

            case 28:
              buntstift.info('Importing application data...');
              stopWaiting = buntstift.wait();
              _context2.prev = 30;
              _context2.next = 33;
              return wolkenkit.commands.import({
                directory: directory,
                env: env,
                from: from,
                toEventStore: toEventStore
              }, showProgress(verbose, stopWaiting));

            case 33:
              _context2.next = 48;
              break;

            case 35:
              _context2.prev = 35;
              _context2.t13 = _context2["catch"](30);
              stopWaiting();
              _context2.t14 = _context2.t13.code;
              _context2.next = _context2.t14 === 'EAPPLICATIONNOTRUNNING' ? 41 : _context2.t14 === 'EAPPLICATIONPARTIALLYRUNNING' ? 43 : 45;
              break;

            case 41:
              buntstift.error('The application is not running.');
              return _context2.abrupt("break", 47);

            case 43:
              buntstift.error('The application is partially running.');
              return _context2.abrupt("break", 47);

            case 45:
              buntstift.error('Failed to import application data.');
              return _context2.abrupt("break", 47);

            case 47:
              throw _context2.t13;

            case 48:
              stopWaiting();
              buntstift.success('Imported application data.');

            case 50:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[30, 35]]);
    }));

    function run(_x) {
      return _run.apply(this, arguments);
    }

    return run;
  }()
};
module.exports = importCommand;