'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage');

var help = {
  description: 'Show the help.',

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
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      var commands;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              // Since we have a cyclic dependency here, we need to call this require
              // at runtime, not at load-time.

              /* eslint-disable global-require */
              commands = require('./index');
              /* eslint-enable global-require */

              buntstift.info(getUsage([{ header: 'wolkenkit', content: 'Manages wolkenkit.' }, { header: 'Synopsis', content: 'wolkenkit <command> [options]' }, {
                header: 'Commands',
                content: (0, _keys2.default)(commands).map(function (command) {
                  return {
                    name: command,
                    description: commands[command].description
                  };
                }).filter(function (command) {
                  return command.description;
                })
              }]));

            case 2:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function run() {
      return _ref2.apply(this, arguments);
    }

    return run;
  }()
};

module.exports = help;