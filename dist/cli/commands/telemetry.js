'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _taggedTemplateLiteral2 = require('babel-runtime/helpers/taggedTemplateLiteral');

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(['\n          wolkenkit telemetry --enable\n          wolkenkit telemetry --disable'], ['\n          wolkenkit telemetry --enable\n          wolkenkit telemetry --disable']);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage'),
    stripIndent = require('common-tags/lib/stripIndent');

var globalOptionDefinitions = require('../globalOptionDefinitions'),
    telemetry = require('../../telemetry');

var command = {
  description: 'Enable or disable collecting telemetry data.',

  getOptionDefinitions: function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt('return', [{
                name: 'enable',
                type: Boolean,
                description: 'enable collecting telemetry data'
              }, {
                name: 'disable',
                type: Boolean,
                description: 'disable collecting telemetry data'
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
      var help, enable, disable, optionList, count, isEnabled;
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
              help = options.help, enable = options.enable, disable = options.disable;

              if (!help) {
                _context2.next = 20;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = { header: 'wolkenkit telemetry', content: this.description };
              _context2.t3 = { header: 'Synopsis', content: stripIndent(_templateObject) };
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
              optionList = { enable: enable, disable: disable };
              count = (0, _keys2.default)(optionList).filter(function (key) {
                return optionList[key] !== undefined;
              }).length;

              if (!(count === 0)) {
                _context2.next = 29;
                break;
              }

              _context2.next = 25;
              return telemetry.isEnabled();

            case 25:
              isEnabled = _context2.sent;

              if (!isEnabled) {
                _context2.next = 28;
                break;
              }

              return _context2.abrupt('return', buntstift.success('Collecting telemetry data is enabled.'));

            case 28:
              return _context2.abrupt('return', buntstift.error('Collecting telemetry data is disabled.'));

            case 29:
              if (!(count > 1)) {
                _context2.next = 32;
                break;
              }

              buntstift.error('Either provide --enable or --disable.');

              throw new Error('Mutually exclusive parameters given');

            case 32:
              if (!enable) {
                _context2.next = 36;
                break;
              }

              _context2.next = 35;
              return telemetry.enable();

            case 35:
              return _context2.abrupt('return', buntstift.success('Enabled collecting telemetry data.'));

            case 36:
              if (!disable) {
                _context2.next = 40;
                break;
              }

              _context2.next = 39;
              return telemetry.disable();

            case 39:
              return _context2.abrupt('return', buntstift.success('Disabled collecting telemetry data.'));

            case 40:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function run(_x) {
      return _ref2.apply(this, arguments);
    }

    return run;
  }()
};

module.exports = command;