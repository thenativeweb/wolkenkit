'use strict';

const assert = require('assertthat');

const switchSemver = require('../../../../clis/wolkenkit/switchSemver');

suite('switchSemver', () => {
  test('is a function.', async () => {
    assert.that(switchSemver).is.ofType('function');
  });

  test('throws an error if version is missing.', async () => {
    await assert.that(async () => {
      await switchSemver();
    }).is.throwingAsync('Version is missing.');
  });

  test('throws an error if handlers are missing.', async () => {
    await assert.that(async () => {
      await switchSemver('1.2.3');
    }).is.throwingAsync('Handlers are missing.');
  });

  test('throws an error if default handler is missing.', async () => {
    await assert.that(async () => {
      await switchSemver('1.2.3', {});
    }).is.throwingAsync('Default is missing.');
  });

  test('runs the default handler if no other handlers matches.', async () => {
    let didHandlerRun = false;

    await switchSemver('1.2.3', {
      async '>= 2.0.0' () {
        throw new Error('Invalid operation.');
      },
      async default () {
        didHandlerRun = true;
      }
    });

    assert.that(didHandlerRun).is.true();
  });

  test('runs the matching handler if a handler matches.', async () => {
    let didHandlerRun = false;

    await switchSemver('1.2.3', {
      async '>= 1.0.0' () {
        didHandlerRun = true;
      },
      async default () {
        throw new Error('Invalid operation.');
      }
    });

    assert.that(didHandlerRun).is.true();
  });

  test('runs the first matching handler if multiple handlers match.', async () => {
    let didHandlerRun = false;

    await switchSemver('1.2.3', {
      async '>= 1.0.0' () {
        didHandlerRun = true;
      },
      async '>= 1.1.0' () {
        throw new Error('Invalid operation.');
      },
      async default () {
        throw new Error('Invalid operation.');
      }
    });

    assert.that(didHandlerRun).is.true();
  });
});
