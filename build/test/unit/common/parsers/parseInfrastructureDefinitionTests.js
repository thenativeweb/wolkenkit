"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const parseInfrastructureDefinition_1 = require("../../../../lib/common/parsers/parseInfrastructureDefinition");
suite('parseInfrastructureDefinition', () => {
    const infrastructureDefinition = {
        async setupInfrastructure() {
            // Intentionally left blank.
        },
        async getInfrastructure() {
            return {
                ask: {},
                tell: {}
            };
        }
    };
    test('does not return an error if everything is fine.', async () => {
        assertthat_1.assert.that(parseInfrastructureDefinition_1.parseInfrastructureDefinition({ infrastructureDefinition })).is.not.anError();
    });
    test('returns an error if the given infrastructure definition is not an object.', async () => {
        assertthat_1.assert.that(parseInfrastructureDefinition_1.parseInfrastructureDefinition({ infrastructureDefinition: undefined })).is.anErrorWithMessage('Infrastructure definition is not an object.');
    });
    test('returns an error if setup infrastructure is missing.', async () => {
        assertthat_1.assert.that(parseInfrastructureDefinition_1.parseInfrastructureDefinition({
            infrastructureDefinition: {
                ...infrastructureDefinition,
                setupInfrastructure: undefined
            }
        })).is.anErrorWithMessage(`Function 'setupInfrastructure' is missing.`);
    });
    test('returns an error if setup infrastructure is not a function.', async () => {
        assertthat_1.assert.that(parseInfrastructureDefinition_1.parseInfrastructureDefinition({
            infrastructureDefinition: {
                ...infrastructureDefinition,
                setupInfrastructure: false
            }
        })).is.anErrorWithMessage(`Property 'setupInfrastructure' is not a function.`);
    });
    test('returns an error if get infrastructure is missing.', async () => {
        assertthat_1.assert.that(parseInfrastructureDefinition_1.parseInfrastructureDefinition({
            infrastructureDefinition: {
                ...infrastructureDefinition,
                getInfrastructure: undefined
            }
        })).is.anErrorWithMessage(`Function 'getInfrastructure' is missing.`);
    });
    test('returns an error if get infrastructure is not a function.', async () => {
        assertthat_1.assert.that(parseInfrastructureDefinition_1.parseInfrastructureDefinition({
            infrastructureDefinition: {
                ...infrastructureDefinition,
                getInfrastructure: false
            }
        })).is.anErrorWithMessage(`Property 'getInfrastructure' is not a function.`);
    });
});
//# sourceMappingURL=parseInfrastructureDefinitionTests.js.map