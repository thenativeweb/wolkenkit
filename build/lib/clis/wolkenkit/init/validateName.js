"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateName = void 0;
const nameRegularExpression_1 = require("./nameRegularExpression");
const validateName = function (value) {
    if (!nameRegularExpression_1.nameRegularExpression.test(value)) {
        throw new Error('Name must be a valid npm package name.');
    }
};
exports.validateName = validateName;
//# sourceMappingURL=validateName.js.map