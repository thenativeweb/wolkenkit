'use strict';

const path = require('path');

const assert = require('assertthat'),
      isolated = require('isolated');

const read = require('../../../../../clis/wolkenkit/file/read'),
      shell = require('../../../../../clis/wolkenkit/shell');

suite('file/read', () => {
  test('is a function.', done => {
    assert.that(read).is.ofType('function');
    done();
  });

  test('throws an error if path is missing.', async () => {
    await assert.that(async () => {
      await read();
    }).is.throwingAsync('Path is missing.');
  });

  test('throws an error if file cannot be found.', async () => {
    const file = path.join(__dirname, '..', '..', '..', '..', 'shared', 'files', 'does-not-exist');

    await assert.that(async () => {
      await read(file);
    }).is.throwingAsync(ex => ex.code === 'EFILENOTFOUND');
  });

  test('throws an error if file is not accessible.', async () => {
    const source = path.join(__dirname, '..', '..', '..', '..', 'shared', 'files', 'someFile.txt');

    const directory = await isolated({ files: [ source ]});
    const target = path.join(directory, 'someFile.txt');

    await shell.chmod('a-r', target);

    await assert.that(async () => {
      await read(target);
    }).is.throwingAsync(ex => ex.code === 'EFILENOTACCESSIBLE');
  });

  test('returns string.', async () => {
    const file = path.join(__dirname, '..', '..', '..', '..', 'shared', 'files', 'someFile.txt');

    const text = await read(file);

    assert.that(text).is.equalTo('some file\n');
  });
});
