"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplateData = void 0;
const configurationDefinition_1 = require("../../../runtimes/microservice/processes/command/configurationDefinition");
const configurationDefinition_2 = require("../../../runtimes/microservice/processes/commandDispatcher/configurationDefinition");
const configurationDefinition_3 = require("../../../runtimes/microservice/processes/domain/configurationDefinition");
const configurationDefinition_4 = require("../../../runtimes/microservice/processes/domainEvent/configurationDefinition");
const configurationDefinition_5 = require("../../../runtimes/microservice/processes/domainEventDispatcher/configurationDefinition");
const configurationDefinition_6 = require("../../../runtimes/microservice/processes/domainEventStore/configurationDefinition");
const configurationDefinition_7 = require("../../../runtimes/microservice/processes/file/configurationDefinition");
const configurationDefinition_8 = require("../../../runtimes/microservice/processes/flow/configurationDefinition");
const configurationDefinition_9 = require("../../../runtimes/microservice/processes/graphql/configurationDefinition");
const configurationDefinition_10 = require("../../../runtimes/microservice/processes/notification/configurationDefinition");
const configurationDefinition_11 = require("../../../runtimes/microservice/processes/publisher/configurationDefinition");
const configurationDefinition_12 = require("../../../runtimes/microservice/processes/replay/configurationDefinition");
const services_1 = require("./services");
const configurationDefinition_13 = require("../../../runtimes/singleProcess/processes/main/configurationDefinition");
const toEnvironmentVariables_1 = require("../../../runtimes/shared/toEnvironmentVariables");
const versions_1 = require("../../../versions");
const configurationDefinition_14 = require("../../../runtimes/microservice/processes/view/configurationDefinition");
const getTemplateData = function ({ appName }) {
    return {
        appName,
        applicationDirectory: '/app',
        configurationDefinitions: {
            microservice: {
                command: configurationDefinition_1.configurationDefinition,
                commandDispatcher: configurationDefinition_2.configurationDefinition,
                domain: configurationDefinition_3.configurationDefinition,
                domainEvent: configurationDefinition_4.configurationDefinition,
                domainEventStore: configurationDefinition_6.configurationDefinition,
                publisher: configurationDefinition_11.configurationDefinition,
                graphql: configurationDefinition_9.configurationDefinition,
                domainEventDispatcher: configurationDefinition_5.configurationDefinition,
                flow: configurationDefinition_8.configurationDefinition,
                replay: configurationDefinition_12.configurationDefinition,
                view: configurationDefinition_14.configurationDefinition,
                notification: configurationDefinition_10.configurationDefinition,
                file: configurationDefinition_7.configurationDefinition
            },
            singleProcess: {
                main: configurationDefinition_13.configurationDefinition
            }
        },
        corsOrigin: '*',
        identityProviders: [],
        services: services_1.services,
        toEnvironmentVariables: toEnvironmentVariables_1.toEnvironmentVariables,
        versions: versions_1.versions
    };
};
exports.getTemplateData = getTemplateData;
//# sourceMappingURL=getTemplateData.js.map