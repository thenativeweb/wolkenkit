'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2.default)(["\n          wolkenkit telemetry --enable\n          wolkenkit telemetry --disable"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage'),
    stripIndent = require('common-tags/lib/stripIndent');

var globalOptionDefinitions = require('../globalOptionDefinitions'),
    telemetry = require('../../telemetry');

var command = {
  description: 'Enable or disable collecting telemetry data.',
  getOptionDefinitions: function () {
    var _getOptionDefinitions = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt("return", [{
                name: 'enable',
                type: Boolean,
                description: 'enable collecting telemetry data'
              }, {
                name: 'disable',
                type: Boolean,
                description: 'disable collecting telemetry data'
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
      var help, enable, disable, optionList, count, isEnabled;
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
              help = options.help, enable = options.enable, disable = options.disable;

              if (!help) {
                _context2.next = 18;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = {
                header: 'wolkenkit telemetry',
                content: this.description
              };
              _context2.t3 = {
                header: 'Synopsis',
                content: stripIndent(_templateObject())
              };
              _context2.t4 = _toConsumableArray2.default;
              _context2.next = 11;
              return this.getOptionDefinitions();

            case 11:
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

            case 18:
              optionList = {
                enable: enable,
                disable: disable
              };
              count = Object.keys(optionList).filter(function (key) {
                return optionList[key] !== undefined;
              }).length;

              if (!(count === 0)) {
                _context2.next = 27;
                break;
              }

              _context2.next = 23;
              return telemetry.isEnabled();

            case 23:
              isEnabled = _context2.sent;

              if (!isEnabled) {
                _context2.next = 26;
                break;
              }

              return _context2.abrupt("return", buntstift.success('Collecting telemetry data is enabled.'));

            case 26:
              return _context2.abrupt("return", buntstift.error('Collecting telemetry data is disabled.'));

            case 27:
              if (!(count > 1)) {
                _context2.next = 30;
                break;
              }

              buntstift.error('Either provide --enable or --disable.');
              throw new Error('Mutually exclusive parameters given');

            case 30:
              if (!enable) {
                _context2.next = 34;
                break;
              }

              _context2.next = 33;
              return telemetry.enable();

            case 33:
              return _context2.abrupt("return", buntstift.success('Enabled collecting telemetry data.'));

            case 34:
              if (!disable) {
                _context2.next = 38;
                break;
              }

              _context2.next = 37;
              return telemetry.disable();

            case 37:
              return _context2.abrupt("return", buntstift.success('Disabled collecting telemetry data.'));

            case 38:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function run(_x) {
      return _run.apply(this, arguments);
    };
  }()
};
module.exports = command;