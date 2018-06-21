'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _taggedTemplateLiteral2 = require('babel-runtime/helpers/taggedTemplateLiteral');

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(['\n          wolkenkit stop [--env <env>] [--dangerously-destroy-data]\n          wolkenkit stop [--env <env>] [--private-key <file>]'], ['\n          wolkenkit stop [--env <env>] [--dangerously-destroy-data]\n          wolkenkit stop [--env <env>] [--private-key <file>]']);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage'),
    processenv = require('processenv'),
    stripIndent = require('common-tags/lib/stripIndent');

var defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var stop = {
  description: 'Stop an application.',

  getOptionDefinitions: function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt('return', [{
                name: 'dangerously-destroy-data',
                type: Boolean,
                defaultValue: defaults.commands.stop.dangerouslyDestroyData,
                description: 'destroy persistent data'
              }, {
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
      var directory, env, help, privateKey, verbose, dangerouslyDestroyData, stopWaiting;
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
              if (!(options['dangerously-destroy-data'] === undefined)) {
                _context2.next = 4;
                break;
              }

              throw new Error('Dangerously destroy data is missing.');

            case 4:
              if (options.env) {
                _context2.next = 6;
                break;
              }

              throw new Error('Environment is missing.');

            case 6:
              directory = process.cwd(), env = options.env, help = options.help, privateKey = options.privateKey, verbose = options.verbose;
              dangerouslyDestroyData = options['dangerously-destroy-data'];

              if (!help) {
                _context2.next = 25;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = { header: 'wolkenkit stop', content: this.description };
              _context2.t3 = { header: 'Synopsis', content: stripIndent(_templateObject) };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray3.default;
              _context2.next = 17;
              return this.getOptionDefinitions();

            case 17:
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

            case 25:

              buntstift.info('Stopping the application...');

              stopWaiting = buntstift.wait();
              _context2.prev = 27;
              _context2.next = 30;
              return wolkenkit.commands.stop({ directory: directory, dangerouslyDestroyData: dangerouslyDestroyData, env: env, privateKey: privateKey }, showProgress(verbose, stopWaiting));

            case 30:
              _context2.next = 37;
              break;

            case 32:
              _context2.prev = 32;
              _context2.t13 = _context2['catch'](27);

              stopWaiting();
              buntstift.error('Failed to stop the application.');

              throw _context2.t13;

            case 37:

              stopWaiting();
              buntstift.success('Stopped the application.');

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

module.exports = stop;