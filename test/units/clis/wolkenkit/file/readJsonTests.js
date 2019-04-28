'use strict';

const path = require('path');

const assert = require('assertthat'),
      isolated = require('isolated');

const readJson = require('../../../../../clis/wolkenkit/file/readJson'),
      shell = require('../../../../../clis/wolkenkit/shell');

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
    const file = path.join(__dirname, '..', '..', '..', '..', 'shared', 'files', 'does-not-exist');

    await assert.that(async () => {
      await readJson(file);
    }).is.throwingAsync(ex => ex.code === 'EFILENOTFOUND');
  });

  test('throws an error if file is not accessible.', async () => {
    const source = path.join(__dirname, '..', '..', '..', '..', 'shared', 'files', 'someFile.json');
    const directory = await isolated({ files: [ source ]});
    const target = path.join(directory, 'someFile.json');

    shell.chmod('a-r', target);

    await assert.that(async () => {
      await readJson(target);
    }).is.throwingAsync(ex => ex.code === 'EFILENOTACCESSIBLE');
  });

  test('throws an error if file does not contain json format.', async () => {
    const file = path.join(__dirname, '..', '..', '..', '..', 'shared', 'files', 'someFile.txt');

    await assert.that(async () => {
      await readJson(file);
    }).is.throwingAsync(ex => ex.code === 'EJSONMALFORMED');
  });

  test('returns json.', async () => {
    const file = path.join(__dirname, '..', '..', '..', '..', 'shared', 'files', 'someFile.json');

    const json = await readJson(file);

    assert.that(json).is.equalTo({
      some: 'file'
    });
  });
});
