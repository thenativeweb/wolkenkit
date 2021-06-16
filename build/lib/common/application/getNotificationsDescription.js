"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationsDescription = void 0;
const common_tags_1 = require("common-tags");
const getNotificationsDescription = function ({ notificationsDefinition }) {
    const notificationsDescription = {};
    for (const [notificationName, notificationHandler] of Object.entries(notificationsDefinition)) {
        const description = {};
        if (notificationHandler.getDocumentation) {
            description.documentation = common_tags_1.stripIndent(notificationHandler.getDocumentation().trim());
        }
        if (notificationHandler.getDataSchema) {
            description.dataSchema = notificationHandler.getDataSchema();
        }
        if (notificationHandler.getMetadataSchema) {
            description.metadataSchema = notificationHandler.getMetadataSchema();
        }
        notificationsDescription[notificationName] = description;
    }
    return notificationsDescription;
};
exports.getNotificationsDescription = getNotificationsDescription;
//# sourceMappingURL=getNotificationsDescription.js.map