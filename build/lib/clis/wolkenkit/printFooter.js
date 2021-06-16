"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printFooter = void 0;
const buntstift_1 = require("buntstift");
const emojis_1 = require("./emojis");
const lodash_1 = require("lodash");
const printFooter = function () {
    buntstift_1.buntstift.info('If you experience any difficulties, please go to:');
    buntstift_1.buntstift.newLine();
    buntstift_1.buntstift.info('  https://docs.wolkenkit.io/latest/getting-started/understanding-wolkenkit/getting-help/');
    buntstift_1.buntstift.newLine();
    buntstift_1.buntstift.info(`Thank you for using wolkenkit ${lodash_1.sample(emojis_1.emojis)}`);
};
exports.printFooter = printFooter;
//# sourceMappingURL=printFooter.js.map