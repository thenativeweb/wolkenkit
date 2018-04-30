'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage');

var defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var init = {
  description: 'Initialize a new application.',

  getOptionDefinitions: function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt('return', [{
                name: 'template',
                alias: 't',
                type: String,
                defaultValue: defaults.commands.init.template,
                description: 'template to clone',
                typeLabel: '<url>'
              }, {
                name: 'force',
                alias: 'f',
                type: Boolean,
                defaultValue: defaults.commands.init.force,
                description: 'force overwriting files'
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
      var directory, help, verbose, template, force, stopWaiting;
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
              if (options.template) {
                _context2.next = 4;
                break;
              }

              throw new Error('Template is missing.');

            case 4:
              if (!(options.force === undefined)) {
                _context2.next = 6;
                break;
              }

              throw new Error('Force is missing.');

            case 6:
              directory = process.cwd(), help = options.help, verbose = options.verbose, template = options.template, force = options.force;

              if (!help) {
                _context2.next = 25;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = { header: 'wolkenkit init', content: this.description };
              _context2.t3 = { header: 'Synopsis', content: 'wolkenkit init [--template <url>] [--force]' };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray3.default;
              _context2.next = 16;
              return this.getOptionDefinitions();

            case 16:
              _context2.t6 = _context2.sent;
              _context2.t7 = (0, _context2.t5)(_context2.t6);
              _context2.t8 = (0, _toConsumableArray3.default)(globalOptionDefinitions);
              _context2.t9 = _context2.t4.concat.call(_context2.t4, _context2.t7, _context2.t8);
              _context2.t10 = {
                header: 'Options',
                optionList: _context2.t9
              };
              _context2.t11 = { header: 'Remarks', content: 'If you don\'t specify a template, ' + defaults.commands.init.template + ' will be used as default.' };
              _context2.t12 = [_context2.t2, _context2.t3, _context2.t10, _context2.t11];
              _context2.t13 = (0, _context2.t1)(_context2.t12);
              return _context2.abrupt('return', _context2.t0.info.call(_context2.t0, _context2.t13));

            case 25:

              buntstift.info('Initializing a new application...');

              stopWaiting = buntstift.wait();
              _context2.prev = 27;
              _context2.next = 30;
              return wolkenkit.init({ directory: directory, template: template, force: force }, showProgress(verbose, stopWaiting));

            case 30:
              _context2.next = 37;
              break;

            case 32:
              _context2.prev = 32;
              _context2.t14 = _context2['catch'](27);

              stopWaiting();
              buntstift.error('Failed to initialize a new application.');

              throw _context2.t14;

            case 37:

              stopWaiting();
              buntstift.success('Initialized a new application.');

            case 39:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[27, 32]]);
    }));

    function run(_x) {
      return _ref2.apply(this, arguments);
    }

    return run;
  }()
};

module.exports = init;