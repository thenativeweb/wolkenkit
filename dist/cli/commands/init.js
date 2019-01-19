'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var buntstift = require('buntstift'),
    getUsage = require('command-line-usage');

var checkDirectory = require('../../wolkenkit/commands/init/checkDirectory'),
    defaults = require('../defaults.json'),
    globalOptionDefinitions = require('../globalOptionDefinitions'),
    showProgress = require('../showProgress'),
    wolkenkit = require('../../wolkenkit');

var init = {
  description: 'Initialize a new application.',
  getOptionDefinitions: function () {
    var _getOptionDefinitions = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt("return", [{
                name: 'template',
                alias: 't',
                type: String,
                description: 'template to clone',
                typeLabel: '<url>'
              }, {
                name: 'force',
                alias: 'f',
                type: Boolean,
                defaultValue: defaults.commands.init.force,
                description: 'force overwriting files'
              }]);

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
      var directory, help, verbose, template, force, stopWaiting, selectedTemplate, availableTemplates, selectedDescription;
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
              if (!(options.force === undefined)) {
                _context2.next = 4;
                break;
              }

              throw new Error('Force is missing.');

            case 4:
              directory = process.cwd(), help = options.help, verbose = options.verbose, template = options.template, force = options.force;

              if (!help) {
                _context2.next = 23;
                break;
              }

              _context2.t0 = buntstift;
              _context2.t1 = getUsage;
              _context2.t2 = {
                header: 'wolkenkit init',
                content: this.description
              };
              _context2.t3 = {
                header: 'Synopsis',
                content: 'wolkenkit init [--template <url>] [--force]'
              };
              _context2.t4 = [];
              _context2.t5 = _toConsumableArray2.default;
              _context2.next = 14;
              return this.getOptionDefinitions();

            case 14:
              _context2.t6 = _context2.sent;
              _context2.t7 = (0, _context2.t5)(_context2.t6);
              _context2.t8 = (0, _toConsumableArray2.default)(globalOptionDefinitions);
              _context2.t9 = _context2.t4.concat.call(_context2.t4, _context2.t7, _context2.t8);
              _context2.t10 = {
                header: 'Options',
                optionList: _context2.t9
              };
              _context2.t11 = {
                header: 'Remarks',
                content: "If you don't specify a template, you will be asked to select one."
              };
              _context2.t12 = [_context2.t2, _context2.t3, _context2.t10, _context2.t11];
              _context2.t13 = (0, _context2.t1)(_context2.t12);
              return _context2.abrupt("return", _context2.t0.info.call(_context2.t0, _context2.t13));

            case 23:
              buntstift.info('Initializing a new application...');
              stopWaiting = buntstift.wait();
              selectedTemplate = template;
              _context2.prev = 26;
              _context2.next = 29;
              return checkDirectory({
                directory: directory,
                force: force
              }, showProgress(verbose, stopWaiting));

            case 29:
              if (selectedTemplate) {
                _context2.next = 35;
                break;
              }

              availableTemplates = [{
                description: 'Empty (directories without files)',
                url: 'https://github.com/thenativeweb/wolkenkit-template-empty.git#master'
              }, {
                description: 'Minimal (directories and files)',
                url: 'https://github.com/thenativeweb/wolkenkit-template-minimal.git#master'
              }, {
                description: 'Chat (sample application)',
                url: 'https://github.com/thenativeweb/wolkenkit-template-chat.git#master'
              }];
              _context2.next = 33;
              return buntstift.select('Select a template to initialize your application with:', availableTemplates.map(function (availableTemplate) {
                return availableTemplate.description;
              }));

            case 33:
              selectedDescription = _context2.sent;
              selectedTemplate = availableTemplates.find(function (availableTemplate) {
                return availableTemplate.description === selectedDescription;
              }).url;

            case 35:
              _context2.next = 37;
              return wolkenkit.commands.init({
                directory: directory,
                template: selectedTemplate,
                force: force
              }, showProgress(verbose, stopWaiting));

            case 37:
              _context2.next = 44;
              break;

            case 39:
              _context2.prev = 39;
              _context2.t14 = _context2["catch"](26);
              stopWaiting();
              buntstift.error('Failed to initialize a new application.');
              throw _context2.t14;

            case 44:
              stopWaiting();
              buntstift.success('Initialized a new application.');

            case 46:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[26, 39]]);
    }));

    function run(_x) {
      return _run.apply(this, arguments);
    }

    return run;
  }()
};
module.exports = init;