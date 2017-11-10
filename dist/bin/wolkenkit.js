#!/usr/bin/env node


'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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

_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
  var validCommands, parsed, suggestions, command, validOptionDefinitions, args;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          validCommands = Object.keys(commands);
          parsed = void 0;


          try {
            parsed = commandLineCommands([null].concat(_toConsumableArray(validCommands)));
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
          _context.t1 = _toConsumableArray(globalOptionDefinitions);
          _context.t2 = _toConsumableArray;
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