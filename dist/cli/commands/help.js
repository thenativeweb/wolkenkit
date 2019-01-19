'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage');

var help = {
  description: 'Show the help.',
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
    _regenerator.default.mark(function _callee2() {
      var commands;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              // Since we have a cyclic dependency here, we need to call this require
              // at runtime, not at load-time.

              /* eslint-disable global-require */
              commands = require('./index');
              /* eslint-enable global-require */

              buntstift.info(getUsage([{
                header: 'wolkenkit',
                content: 'Manages wolkenkit.'
              }, {
                header: 'Synopsis',
                content: 'wolkenkit <command> [options]'
              }, {
                header: 'Commands',
                content: Object.keys(commands).map(function (command) {
                  return {
                    name: command,
                    description: commands[command].description
                  };
                }).filter(function (command) {
                  return command.description;
                })
              }]));

            case 2:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function run() {
      return _run.apply(this, arguments);
    }

    return run;
  }()
};
module.exports = help;