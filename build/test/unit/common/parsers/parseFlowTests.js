"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const parseFlow_1 = require("../../../../lib/common/parsers/parseFlow");
suite('parseFlow', () => {
    const flowDefinition = {
        replayPolicy: 'never',
        domainEventHandlers: {}
    };
    test('does not return an error if everything is fine.', async () => {
        assertthat_1.assert.that(parseFlow_1.parseFlow({ flowDefinition })).is.not.anError();
    });
    test('returns an error if the given flow definition is not an object.', async () => {
        assertthat_1.assert.that(parseFlow_1.parseFlow({ flowDefinition: undefined })).is.anErrorWithMessage('Flow handler is not an object.');
    });
    test('returns an error if domain event handlers are missing.', async () => {
        assertthat_1.assert.that(parseFlow_1.parseFlow({
            flowDefinition: {
                ...flowDefinition,
                domainEventHandlers: undefined
            }
        })).is.anErrorWithMessage(`Object 'domainEventHandlers' is missing.`);
    });
    test('returns an error if domain event handlers is not an object.', async () => {
        assertthat_1.assert.that(parseFlow_1.parseFlow({
            flowDefinition: {
                ...flowDefinition,
                domainEventHandlers: false
            }
        })).is.anErrorWithMessage(`Property 'domainEventHandlers' is not an object.`);
    });
    test('returns an error if a malformed domain event handler is found.', async () => {
        assertthat_1.assert.that(parseFlow_1.parseFlow({
            flowDefinition: {
                ...flowDefinition,
                domainEventHandlers: {
                    sampleHandler: false
                }
            }
        })).is.anErrorWithMessage(`Domain event handler 'sampleHandler' is malformed: Property 'domainEventHandler' is not an object.`);
    });
});
//# sourceMappingURL=parseFlowTests.js.map