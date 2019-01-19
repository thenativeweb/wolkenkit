'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2.default)(["\n          wolkenkit status [--env <env>]\n          wolkenkit status [--env <env>] [--private-key <file>]"]);

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

var status = {
  description: 'Fetch an application status.',
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
                name: 'private-key',
                alias: 'k',
                type: String,
                description: 'select private key',
                typeLabel: '<file>'
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
      var directory, env, help, verbose, privateKey, stopWaiting;
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
              privateKey = options['private-key'];

              if (!help) {
                _context2.next = 23;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = {
                header: 'wolkenkit status',
                content: this.description
              };
              _context2.t3 = {
                header: 'Synopsis',
                content: stripIndent(_templateObject())
              };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray2.default;
              _context2.next = 15;
              return this.getOptionDefinitions();

            case 15:
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

            case 23:
              buntstift.info('Fetching application status...');
              stopWaiting = buntstift.wait();
              _context2.prev = 25;
              _context2.next = 28;
              return wolkenkit.commands.status({
                directory: directory,
                env: env,
                privateKey: privateKey
              }, showProgress(verbose, stopWaiting));

            case 28:
              _context2.next = 46;
              break;

            case 30:
              _context2.prev = 30;
              _context2.t13 = _context2["catch"](25);
              stopWaiting();

              if (!(_context2.t13.code === 'EAPPLICATIONNOTRUNNING')) {
                _context2.next = 35;
                break;
              }

              return _context2.abrupt("return", buntstift.success('The application is stopped.'));

            case 35:
              if (!(_context2.t13.code === 'EAPPLICATIONVERIFYINGCONNECTIONS')) {
                _context2.next = 37;
                break;
              }

              return _context2.abrupt("return", buntstift.success('The application is trying to connect to infrastructure services.'));

            case 37:
              if (!(_context2.t13.code === 'EAPPLICATIONBUILDING')) {
                _context2.next = 39;
                break;
              }

              return _context2.abrupt("return", buntstift.success('The application is building.'));

            case 39:
              if (!(_context2.t13.code === 'EAPPLICATIONTERMINATING')) {
                _context2.next = 41;
                break;
              }

              return _context2.abrupt("return", buntstift.success('The application is stopping.'));

            case 41:
              if (!(_context2.t13.code === 'EAPPLICATIONPARTIALLYRUNNING')) {
                _context2.next = 44;
                break;
              }

              buntstift.error('The application is partially running.');
              throw _context2.t13;

            case 44:
              buntstift.error('Failed to fetch application status.');
              throw _context2.t13;

            case 46:
              stopWaiting();
              buntstift.success('The application is running.');

            case 48:
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
module.exports = status;