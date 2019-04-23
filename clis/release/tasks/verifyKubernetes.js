'use strict';

const stripAnsi = require('strip-ansi');

const shell = require('../shell');

const kubernetesUrl = 'https://82aed009-6c00-433c-b98d-b5fb9dfc36aa.k8s.ondigitalocean.com';

const verifyKubernetes = async function () {
  const { code, stdout } = await shell.exec('kubectl cluster-info', { silent: true });

  if (code !== 0) {
    throw new Error('Failed to get Kubernetes cluster information.');
  }

  if (!stripAnsi(stdout).includes(`Kubernetes master is running at ${kubernetesUrl}`)) {
    throw new Error(`Failed to connect to ${kubernetesUrl}.`);
  }
};

module.exports = verifyKubernetes;
