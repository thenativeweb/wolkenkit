'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage');

var defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var init = {
  description: 'Initialize a new application.',

  getOptionDefinitions: function getOptionDefinitions() {
    var _this = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
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
              }]);

            case 1:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  },
  run: function run(options) {
    var _this2 = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var directory, help, verbose, template, stopWaiting;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
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
              directory = process.cwd(), help = options.help, verbose = options.verbose, template = options.template;

              if (!help) {
                _context2.next = 23;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = { header: 'wolkenkit init', content: _this2.description };
              _context2.t3 = { header: 'Synopsis', content: 'wolkenkit init [--template <url>]' };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray;
              _context2.next = 14;
              return _this2.getOptionDefinitions();

            case 14:
              _context2.t6 = _context2.sent;
              _context2.t7 = (0, _context2.t5)(_context2.t6);
              _context2.t8 = _toConsumableArray(globalOptionDefinitions);
              _context2.t9 = _context2.t4.concat.call(_context2.t4, _context2.t7, _context2.t8);
              _context2.t10 = {
                header: 'Options',
                optionList: _context2.t9
              };
              _context2.t11 = { header: 'Remarks', content: 'If you don\'t specify a template, ' + defaults.commands.init.template + ' will be used as default.' };
              _context2.t12 = [_context2.t2, _context2.t3, _context2.t10, _context2.t11];
              _context2.t13 = (0, _context2.t1)(_context2.t12);
              return _context2.abrupt('return', _context2.t0.info.call(_context2.t0, _context2.t13));

            case 23:

              buntstift.info('Initializing a new application...');

              stopWaiting = buntstift.wait();
              _context2.prev = 25;
              _context2.next = 28;
              return wolkenkit.init({ directory: directory, template: template }, showProgress(verbose, stopWaiting));

            case 28:
              _context2.next = 35;
              break;

            case 30:
              _context2.prev = 30;
              _context2.t14 = _context2['catch'](25);

              stopWaiting();
              buntstift.error('Failed to initialize a new application.');

              throw _context2.t14;

            case 35:

              stopWaiting();
              buntstift.success('Initialized a new application.');

            case 37:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2, [[25, 30]]);
    }))();
  }
};

module.exports = init;