'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var errors = require('../../../errors'),
    runtimes = require('../../runtimes'),
    shell = require('../../../shell');

var cloneRepository =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, progress) {
    var directory, template, latestStableVersion, wolkenkitUrl, matches, _matches, url, branch, branchOption;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (options) {
              _context.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.template) {
              _context.next = 6;
              break;
            }

            throw new Error('Template is missing.');

          case 6:
            if (progress) {
              _context.next = 8;
              break;
            }

            throw new Error('Progress is missing.');

          case 8:
            directory = options.directory, template = options.template;
            _context.next = 11;
            return runtimes.getLatestStableVersion();

          case 11:
            latestStableVersion = _context.sent;
            wolkenkitUrl = "https://docs.wolkenkit.io/".concat(latestStableVersion, "/getting-started/installing-wolkenkit/verifying-system-requirements/");
            matches = template.match(/^((?:git:|ssh:|https:\/\/|git@[\w.]+)[\w.@:/~_-]+(?:\.git)?\/?)(?:#([a-zA-Z0-9/.\-_]+))?$/);

            if (matches) {
              _context.next = 17;
              break;
            }

            progress({
              message: 'Malformed url.',
              type: 'info'
            });
            throw new errors.UrlMalformed();

          case 17:
            _context.next = 19;
            return shell.which('git');

          case 19:
            if (_context.sent) {
              _context.next = 22;
              break;
            }

            progress({
              message: "git is not installed (see ".concat(wolkenkitUrl, " for how to install wolkenkit)."),
              type: 'info'
            });
            throw new errors.ExecutableNotFound();

          case 22:
            _matches = (0, _slicedToArray2.default)(matches, 3), url = _matches[1], branch = _matches[2];
            branchOption = branch ? "--branch ".concat(branch) : '';
            progress({
              message: "Cloning ".concat(template, "...")
            });
            _context.prev = 25;
            _context.next = 28;
            return shell.exec("git clone ".concat(branchOption, " ").concat(url, " ."), {
              silent: true,
              cwd: directory
            });

          case 28:
            _context.next = 35;
            break;

          case 30:
            _context.prev = 30;
            _context.t0 = _context["catch"](25);
            progress({
              message: "".concat(_context.t0.stderr)
            });
            progress({
              message: 'git failed to clone the template.',
              type: 'info'
            });
            throw _context.t0;

          case 35:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[25, 30]]);
  }));

  return function cloneRepository(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = cloneRepository;