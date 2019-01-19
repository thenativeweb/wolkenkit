#!/usr/bin/env node
'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

require('babel-polyfill');

var buntstift = require('buntstift'),
    commandLineArgs = require('command-line-args'),
    commandLineCommands = require('command-line-commands'),
    findSuggestions = require('findsuggestions'),
    updateNotifier = require('update-notifier');

var commands = require('../cli/commands'),
    globalOptionDefinitions = require('../cli/globalOptionDefinitions'),
    packageJson = require('../../package.json'),
    telemetry = require('../telemetry');

updateNotifier({
  pkg: packageJson
}).notify();
(0, _asyncToGenerator2.default)(
/*#__PURE__*/
_regenerator.default.mark(function _callee() {
  var validCommands, parsed, suggestions, command, validOptionDefinitions, args, handleException;
  return _regenerator.default.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          validCommands = Object.keys(commands);

          try {
            parsed = commandLineCommands([null].concat((0, _toConsumableArray2.default)(validCommands)));
          } catch (ex) {
            suggestions = findSuggestions({
              for: ex.command,
              in: validCommands
            });
            buntstift.error("Unknown command '".concat(ex.command, "', did you mean '").concat(suggestions[0].suggestion, "'?"));
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
          _context.t1 = (0, _toConsumableArray2.default)(globalOptionDefinitions);
          _context.t2 = _toConsumableArray2.default;
          _context.next = 9;
          return command.getOptionDefinitions();

        case 9:
          _context.t3 = _context.sent;
          _context.t4 = (0, _context.t2)(_context.t3);
          validOptionDefinitions = _context.t0.concat.call(_context.t0, _context.t1, _context.t4);
          args = commandLineArgs(validOptionDefinitions, {
            argv: parsed.argv,
            partial: true
          });
          /* eslint-disable no-underscore-dangle */

          if (args._unknown && args._unknown.length > 0) {
            buntstift.error("Unknown argument '".concat(args._unknown[0], "'."));
            buntstift.exit(1);
          }
          /* eslint-enable no-underscore-dangle */


          handleException = function handleException(ex) {
            if (ex.message) {
              buntstift.verbose(ex.message);
            }

            if (ex.stack) {
              buntstift.verbose(ex.stack);
            }

            buntstift.exit(1);
          };

          process.on('uncaughtException', handleException);
          process.on('unhandledRejection', handleException);
          _context.next = 19;
          return telemetry.init();

        case 19:
          _context.prev = 19;
          _context.next = 22;
          return command.run(args);

        case 22:
          _context.next = 24;
          return telemetry.send({
            command: parsed.command,
            args: args
          });

        case 24:
          _context.next = 29;
          break;

        case 26:
          _context.prev = 26;
          _context.t5 = _context["catch"](19);
          handleException(_context.t5);

        case 29:
          buntstift.exit(0);

        case 30:
        case "end":
          return _context.stop();
      }
    }
  }, _callee, this, [[19, 26]]);
}))();