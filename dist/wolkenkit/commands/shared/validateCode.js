'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var path = require('path');

var eslint = require('eslint'),
    wolkenkitApplication = require('wolkenkit-application');

var errors = require('../../../errors');

var validateCode =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var directory, cliEngine, report, errorCount, warningCount, problemCount, message;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = _ref.directory;

            if (directory) {
              _context.next = 3;
              break;
            }

            throw new Error('Directory is missing.');

          case 3:
            if (progress) {
              _context.next = 5;
              break;
            }

            throw new Error('Progress is missing.');

          case 5:
            progress({
              message: 'Validating the application code...',
              type: 'info'
            });
            _context.prev = 6;
            _context.next = 9;
            return wolkenkitApplication.validate({
              directory: directory
            });

          case 9:
            _context.next = 15;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](6);
            progress({
              message: _context.t0.message,
              type: 'info'
            });
            throw _context.t0;

          case 15:
            cliEngine = new eslint.CLIEngine({
              envs: ['node', 'es6'],
              parserOptions: {
                ecmaVersion: 2019,
                ecmaFeatures: {}
              },
              rules: {
                'no-undef': 'error'
              },
              useEslintrc: false
            });
            report = cliEngine.executeOnFiles([path.join(directory, 'server', '**', '*.js')]);

            if (!(report.errorCount === 0)) {
              _context.next = 19;
              break;
            }

            return _context.abrupt("return");

          case 19:
            errorCount = report.errorCount, warningCount = report.warningCount;
            problemCount = errorCount + warningCount;
            message = '';
            message += "".concat(problemCount, " problem").concat(problemCount !== 1 ? 's' : '', " ");
            message += "(".concat(errorCount, " error").concat(errorCount !== 1 ? 's' : '', ", ");
            message += "".concat(warningCount, " warning").concat(warningCount !== 1 ? 's' : '', ")");
            throw new errors.CodeMalformed(message, report);

          case 26:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[6, 11]]);
  }));

  return function validateCode(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = validateCode;