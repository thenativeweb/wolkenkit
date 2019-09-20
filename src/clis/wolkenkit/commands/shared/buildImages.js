'use strict';

const fs = require('fs'),
      os = require('os'),
      path = require('path'),
      { promisify } = require('util');

const docker = require('../../docker'),
      shell = require('../../shell');

const mkdtemp = promisify(fs.mkdtemp),
      writeFile = promisify(fs.writeFile);

const buildImages = async function ({ configuration, directory, images }, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!images) {
    throw new Error('Images are missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const applicationName = configuration.application.name;

  await Promise.all(images.map(async image => {
    const imageSuffix = image.name.replace(/^thenativeweb\/wolkenkit-/u, '');
    const tag = `${applicationName}-${imageSuffix}`;

    const buildDirectory = await mkdtemp(`${os.tmpdir()}${path.sep}`);
    const dockerfile = path.join(buildDirectory, 'Dockerfile');

    await shell.cp('-R', path.join(directory, 'package.json'), buildDirectory);
    await shell.cp('-R', path.join(directory, 'server'), buildDirectory);

    await writeFile(dockerfile, `FROM ${image.name}:${image.version}\n`, { encoding: 'utf8' });
    await docker.buildImage({ configuration, directory: buildDirectory, tag });
    progress({ message: `Built ${tag}.` });
  }));
};

module.exports = buildImages;
