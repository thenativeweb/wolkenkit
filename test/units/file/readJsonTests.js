'use strict';

const path = require('path');

const assert = require('assertthat'),
      isolated = require('isolated');

const readJson = require('../../../lib/file/readJson'),
      shell = require('../../../lib/shell');

suite('file/readJson', () => {
  test('is a function.', done => {
    assert.that(readJson).is.ofType('function');
    done();
  });

  test('throws an error if path is missing.', async () => {
    await assert.that(async () => {
      await readJson();
    }).is.throwingAsync('Path is missing.');
  });

  test('throws an error if file cannot be found.', async () => {
    await assert.that(async () => {
      await readJson('/not/found');
    }).is.throwingAsync(ex => ex.code === 'EFILENOTFOUND');
  });

  test('throws an error if file is not accessible.', async () => {
    const source = path.join(__dirname, '..', '..', 'shared', 'configuration', 'validJson', 'package.json');
    const directory = await isolated({ files: [ source ]});
    const target = path.join(directory, 'package.json');

    await shell.chmod('a-r', target);

    await assert.that(async () => {
      await readJson(target);
    }).is.throwingAsync(ex => ex.code === 'EFILENOTACCESSIBLE');
  });

  test('throws an error if file does not contain json format.', async () => {
    const file = path.join(__dirname, '..', '..', 'shared', 'configuration', 'invalidJson', 'package.json');

    await assert.that(async () => {
      await readJson(file);
    }).is.throwingAsync(ex => ex.code === 'EJSONMALFORMED');
  });

  test('returns json.', async () => {
    const file = path.join(__dirname, '..', '..', 'shared', 'configuration', 'validJson', 'package.json');

    const json = await readJson(file);

    assert.that(json).is.equalTo({
      name: 'wolkenkit-template-chat',
      version: '0.0.0',
      description: 'wolkenkit-template-chat is a sample application for wolkenkit.',
      private: true,
      dependencies: {
        'wolkenkit-command-tools': 'git+ssh://git@github.com/thenativeweb/wolkenkit-command-tools.git#0.4.0'
      }
    });
  });
});
