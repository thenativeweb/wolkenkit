'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _taggedTemplateLiteral2 = require('babel-runtime/helpers/taggedTemplateLiteral');

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(['\n          wolkenkit status [--env <env>]\n          wolkenkit status [--env <env>] [--private-key <file>]'], ['\n          wolkenkit status [--env <env>]\n          wolkenkit status [--env <env>] [--private-key <file>]']);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage'),
    processenv = require('processenv'),
    stripIndent = require('common-tags/lib/stripIndent');

var defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var status = {
  description: 'Fetch an application status.',

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
      var directory, env, help, privateKey, verbose, stopWaiting;
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
              directory = process.cwd(), env = options.env, help = options.help, privateKey = options.privateKey, verbose = options.verbose;

              if (!help) {
                _context2.next = 22;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = { header: 'wolkenkit status', content: this.description };
              _context2.t3 = { header: 'Synopsis', content: stripIndent(_templateObject) };
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

              buntstift.info('Fetching application status...');

              stopWaiting = buntstift.wait();
              _context2.prev = 24;
              _context2.next = 27;
              return wolkenkit.commands.status({ directory: directory, env: env, privateKey: privateKey }, showProgress(verbose, stopWaiting));

            case 27:
              _context2.next = 39;
              break;

            case 29:
              _context2.prev = 29;
              _context2.t13 = _context2['catch'](24);

              stopWaiting();

              if (!(_context2.t13.code === 'EAPPLICATIONNOTRUNNING')) {
                _context2.next = 34;
                break;
              }

              return _context2.abrupt('return', buntstift.success('The application is stopped.'));

            case 34:
              if (!(_context2.t13.code === 'EAPPLICATIONPARTIALLYRUNNING')) {
                _context2.next = 37;
                break;
              }

              buntstift.error('The application is partially running.');
              throw _context2.t13;

            case 37:

              buntstift.error('Failed to fetch application status.');
              throw _context2.t13;

            case 39:

              stopWaiting();
              buntstift.success('The application is running.');

            case 41:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[24, 29]]);
    }));

    function run(_x) {
      return _ref2.apply(this, arguments);
    }

    return run;
  }()
};

module.exports = status;