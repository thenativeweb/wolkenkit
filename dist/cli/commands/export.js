'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2.default)(["\n          wolkenkit export [--env <env>] --to=<directory> [--from-event-store]"]);

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

var exportCommand = {
  description: 'Export application data.',
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
                name: 'to',
                alias: 't',
                type: String,
                description: 'set the directory to export to',
                typeLabel: '<directory>'
              }, {
                name: 'from-event-store',
                type: Boolean,
                defaultValue: defaults.commands.export.fromEventStore,
                description: 'export the event store'
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
      var directory, env, to, help, verbose, fromEventStore, stopWaiting;
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
              if (!(options['from-event-store'] === undefined)) {
                _context2.next = 6;
                break;
              }

              throw new Error('From event store is missing.');

            case 6:
              directory = process.cwd(), env = options.env, to = options.to, help = options.help, verbose = options.verbose;
              fromEventStore = options['from-event-store'];

              if (!help) {
                _context2.next = 23;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = {
                header: 'wolkenkit export',
                content: this.description
              };
              _context2.t3 = {
                header: 'Synopsis',
                content: stripIndent(_templateObject())
              };
              _context2.t4 = _toConsumableArray2.default;
              _context2.next = 16;
              return this.getOptionDefinitions();

            case 16:
              _context2.t5 = _context2.sent;
              _context2.t6 = (0, _toConsumableArray2.default)(globalOptionDefinitions);
              _context2.t7 = (0, _context2.t4)(_context2.t5).concat(_context2.t6);
              _context2.t8 = {
                header: 'Options',
                optionList: _context2.t7
              };
              _context2.t9 = [_context2.t2, _context2.t3, _context2.t8];
              _context2.t10 = (0, _context2.t1)(_context2.t9);
              return _context2.abrupt("return", _context2.t0.info.call(_context2.t0, _context2.t10));

            case 23:
              if (to) {
                _context2.next = 26;
                break;
              }

              buntstift.error('The --to option is missing.');
              throw new Error('To is missing.');

            case 26:
              buntstift.info('Exporting application data...');
              stopWaiting = buntstift.wait();
              _context2.prev = 28;
              _context2.next = 31;
              return wolkenkit.commands.export({
                directory: directory,
                env: env,
                to: to,
                fromEventStore: fromEventStore
              }, showProgress(verbose, stopWaiting));

            case 31:
              _context2.next = 46;
              break;

            case 33:
              _context2.prev = 33;
              _context2.t11 = _context2["catch"](28);
              stopWaiting();
              _context2.t12 = _context2.t11.code;
              _context2.next = _context2.t12 === 'EAPPLICATIONNOTRUNNING' ? 39 : _context2.t12 === 'EAPPLICATIONPARTIALLYRUNNING' ? 41 : 43;
              break;

            case 39:
              buntstift.error('The application is not running.');
              return _context2.abrupt("break", 45);

            case 41:
              buntstift.error('The application is partially running.');
              return _context2.abrupt("break", 45);

            case 43:
              buntstift.error('Failed to export application data.');
              return _context2.abrupt("break", 45);

            case 45:
              throw _context2.t11;

            case 46:
              stopWaiting();
              buntstift.success('Exported application data.');

            case 48:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[28, 33]]);
    }));

    return function run(_x) {
      return _run.apply(this, arguments);
    };
  }()
};
module.exports = exportCommand;