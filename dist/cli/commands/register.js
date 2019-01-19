'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage'),
    open = require('open');

var globalOptionDefinitions = require('../globalOptionDefinitions');

var register = {
  getOptionDefinitions: function () {
    var _getOptionDefinitions = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt("return", []);

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
      var help, url;
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
              help = options.help;

              if (!help) {
                _context2.next = 20;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = {
                header: 'wolkenkit register',
                content: this.description
              };
              _context2.t3 = {
                header: 'Synopsis',
                content: 'wolkenkit register'
              };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray2.default;
              _context2.next = 12;
              return this.getOptionDefinitions();

            case 12:
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

            case 20:
              url = 'https://profile.thenativeweb.io';
              buntstift.info("Pointing web browser to ".concat(url, "..."));
              open(url);

            case 23:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function run(_x) {
      return _run.apply(this, arguments);
    }

    return run;
  }()
};
module.exports = register;