#!/usr/bin/env node


'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('babel-polyfill');

var buntstift = require('buntstift'),
    commandLineArgs = require('command-line-args'),
    commandLineCommands = require('command-line-commands'),
    findSuggestions = require('findsuggestions'),
    updateNotifier = require('update-notifier');

var commands = require('../cli/commands'),
    globalOptionDefinitions = require('../cli/globalOptionDefinitions'),
    packageJson = require('../../package.json');

updateNotifier({ pkg: packageJson }).notify();

(0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
  var validCommands, parsed, suggestions, command, validOptionDefinitions, args;
  return _regenerator2.default.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          validCommands = (0, _keys2.default)(commands);
          parsed = void 0;


          try {
            parsed = commandLineCommands([null].concat((0, _toConsumableArray3.default)(validCommands)));
          } catch (ex) {
            suggestions = findSuggestions({ for: ex.command, in: validCommands });


            buntstift.error('Unknown command \'' + ex.command + '\', did you mean \'' + suggestions[0].suggestion + '\'?');
            buntstift.exit(1);
          }

          if (!parsed.command) {
            if (parsed.argv.length > 0 && parsed.argv.includes('--version')) {
              buntstift.info(packageJson.version);
              buntstift.exit(0);
            }

            parsed.command = 'help';
          }

          command = commands[parsed.command];
          _context.t0 = [];
          _context.t1 = (0, _toConsumableArray3.default)(globalOptionDefinitions);
          _context.t2 = _toConsumableArray3.default;
          _context.next = 10;
          return command.getOptionDefinitions();

        case 10:
          _context.t3 = _context.sent;
          _context.t4 = (0, _context.t2)(_context.t3);
          validOptionDefinitions = _context.t0.concat.call(_context.t0, _context.t1, _context.t4);
          args = commandLineArgs(validOptionDefinitions, { argv: parsed.argv, partial: true });

          /* eslint-disable no-underscore-dangle */

          if (args._unknown && args._unknown.length > 0) {
            buntstift.error('Unknown argument \'' + args._unknown[0] + '\'.');
            buntstift.exit(1);
          }
          /* eslint-enable no-underscore-dangle */

          _context.prev = 15;
          _context.next = 18;
          return command.run(args);

        case 18:
          _context.next = 25;
          break;

        case 20:
          _context.prev = 20;
          _context.t5 = _context['catch'](15);

          if (_context.t5.message) {
            buntstift.verbose(_context.t5.message);
          }
          if (_context.t5.stack) {
            buntstift.verbose(_context.t5.stack);
          }
          buntstift.exit(1);

        case 25:

          buntstift.exit(0);

        case 26:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this, [[15, 20]]);
}))();