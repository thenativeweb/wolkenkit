"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationDescription = void 0;
const getCommandsDescription_1 = require("./getCommandsDescription");
const getDomainEventsDescription_1 = require("./getDomainEventsDescription");
const getNotificationsDescription_1 = require("./getNotificationsDescription");
const getViewsDescription_1 = require("./getViewsDescription");
const getApplicationDescription = function ({ application }) {
    const applicationDescription = {
        commands: getCommandsDescription_1.getCommandsDescription({ domainDefinition: application.domain }),
        domainEvents: getDomainEventsDescription_1.getDomainEventsDescription({ domainDefinition: application.domain }),
        notifications: getNotificationsDescription_1.getNotificationsDescription({ notificationsDefinition: application.notifications }),
        views: getViewsDescription_1.getViewsDescription({ viewsDefinition: application.views })
    };
    return applicationDescription;
};
exports.getApplicationDescription = getApplicationDescription;
//# sourceMappingURL=getApplicationDescription.js.map