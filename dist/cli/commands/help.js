'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage');

var help = {
  description: 'Show the help.',

  getOptionDefinitions: function getOptionDefinitions() {
    var _this = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt('return', []);

            case 1:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  },
  run: function run() {
    var _this2 = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var commands;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              // Since we have a cyclic dependency here, we need to call this require
              // at runtime, not at load-time.

              /* eslint-disable global-require */
              commands = require('./index');
              /* eslint-enable global-require */

              buntstift.info(getUsage([{ header: 'wolkenkit', content: 'Manages wolkenkit.' }, { header: 'Synposis', content: 'wolkenkit <command> [options]' }, {
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
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
};

module.exports = help;