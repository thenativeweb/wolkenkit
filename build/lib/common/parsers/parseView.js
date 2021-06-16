"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseView = void 0;
const parseNotificationSubscriber_1 = require("./parseNotificationSubscriber");
const parseQueryHandler_1 = require("./parseQueryHandler");
const defekt_1 = require("defekt");
const lodash_1 = require("lodash");
const errors = __importStar(require("../errors"));
const parseView = function ({ viewDefinition }) {
    if (!lodash_1.isObjectLike(viewDefinition)) {
        return defekt_1.error(new errors.ViewDefinitionMalformed(`View handler is not an object.`));
    }
    if (lodash_1.isUndefined(viewDefinition.queryHandlers)) {
        return defekt_1.error(new errors.ViewDefinitionMalformed(`Object 'queryHandlers' is missing.`));
    }
    if (!lodash_1.isObjectLike(viewDefinition.queryHandlers)) {
        return defekt_1.error(new errors.ViewDefinitionMalformed(`Property 'queryHandlers' is not an object.`));
    }
    for (const [queryName, queryHandler] of Object.entries(viewDefinition.queryHandlers)) {
        const parseResult = parseQueryHandler_1.parseQueryHandler({ queryHandler });
        if (parseResult.hasError()) {
            return defekt_1.error(new errors.ViewDefinitionMalformed(`Query handler '${queryName}' is malformed: ${parseResult.error.message}`));
        }
    }
    if (!lodash_1.isUndefined(viewDefinition.notificationSubscribers)) {
        if (!lodash_1.isObjectLike(viewDefinition.notificationSubscribers)) {
            return defekt_1.error(new errors.ViewDefinitionMalformed(`Property 'notificationSubscribers' is not an object.`));
        }
        for (const [notificationSubscriberName, notificationSubscriber] of Object.entries(viewDefinition.notificationSubscribers)) {
            const parseResult = parseNotificationSubscriber_1.parseNotificationSubscriber({ notificationSubscriber });
            if (parseResult.hasError()) {
                return defekt_1.error(new errors.ViewDefinitionMalformed(`Notification subscriber '${notificationSubscriberName}' is malformed: ${parseResult.error.message}`));
            }
        }
    }
    if (!lodash_1.isUndefined(viewDefinition.enhancers)) {
        if (!lodash_1.isArray(viewDefinition.enhancers)) {
            return defekt_1.error(new errors.ViewDefinitionMalformed(`Property 'enhancers' is not an array.`));
        }
        for (const [index, enhancer] of viewDefinition.enhancers.entries()) {
            if (!lodash_1.isFunction(enhancer)) {
                return defekt_1.error(new errors.ViewDefinitionMalformed(`View enhancer at index '${index}' is not a function.`));
            }
        }
    }
    return defekt_1.value(viewDefinition);
};
exports.parseView = parseView;
//# sourceMappingURL=parseView.js.map