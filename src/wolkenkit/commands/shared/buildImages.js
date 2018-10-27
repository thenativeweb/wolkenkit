'use strict';

const fs = require('fs'),
      os = require('os'),
      path = require('path');

const promisify = require('util.promisify');

const docker = require('../../../docker'),
      runtimes = require('../../runtimes'),
      shell = require('../../../shell');

const mkdtemp = promisify(fs.mkdtemp),
      writeFile = promisify(fs.writeFile);

const buildImages = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { directory, configuration, env } = options;

  const name = configuration.application,
        runtime = configuration.runtime.version;

  const images = await runtimes.getImages({ forVersion: runtime });

  await Promise.all(images.map(async image => {
    const imageSuffix = image.name.replace(/^thenativeweb\/wolkenkit-/, '');
    const tag = `${name}-${imageSuffix}`;

    const buildDirectory = await mkdtemp(`${os.tmpdir()}${path.sep}`);
    const dockerfile = path.join(buildDirectory, 'Dockerfile');

    await shell.cp('-R', path.join(directory, 'package.json'), buildDirectory);
    await shell.cp('-R', path.join(directory, 'server'), buildDirectory);

    await writeFile(dockerfile, `FROM ${image.name}:${image.version}\n`, { encoding: 'utf8' });
    await docker.buildImage({ configuration, env, tag, directory: buildDirectory });
    progress({ message: `Built ${tag}.` });
  }));
};

module.exports = buildImages;
