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

var errors = require('../../errors'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var update = {
  description: 'Update the wolkenkit CLI (deprecated, use npm instead).',

  getOptionDefinitions: function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt('return', []);

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
      var help, verbose, stopWaiting;
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
              help = options.help, verbose = options.verbose;

              if (!help) {
                _context2.next = 20;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = { header: 'wolkenkit update', content: this.description };
              _context2.t3 = { header: 'Synopsis', content: 'wolkenkit update' };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray3.default;
              _context2.next = 12;
              return this.getOptionDefinitions();

            case 12:
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

            case 20:

              buntstift.info('Updating the wolkenkit CLI...');

              stopWaiting = buntstift.wait();
              _context2.prev = 22;
              _context2.next = 25;
              return wolkenkit.update(showProgress(verbose, stopWaiting));

            case 25:
              _context2.next = 33;
              break;

            case 27:
              _context2.prev = 27;
              _context2.t13 = _context2['catch'](22);

              stopWaiting();

              if (_context2.t13 instanceof errors.VersionAlreadyInstalled) {
                buntstift.success('The latest wolkenkit CLI is already installed.');
              } else {
                buntstift.error('Failed to update the wolkenkit CLI.');
              }

              buntstift.warn('The command update is deprecated and will be removed in a future version, use npm instead.');

              throw _context2.t13;

            case 33:

              stopWaiting();
              buntstift.success('Updated the wolkenkit CLI.');
              buntstift.warn('The command update is deprecated and will be removed in a future version, use npm instead.');

            case 36:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[22, 27]]);
    }));

    function run(_x) {
      return _ref2.apply(this, arguments);
    }

    return run;
  }()
};

module.exports = update;