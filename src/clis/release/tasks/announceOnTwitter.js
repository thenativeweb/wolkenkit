'use strict';

const arrayJoinConjunction = require('array-join-conjunction'),
      buntstift = require('buntstift'),
      Twitter = require('twitter');

const announceOnTwitter = async function ({ mode, versions, twitterHandles, twitterCredentials, cwd }) {
  if (!mode) {
    throw new Error('Mode is missing.');
  }
  if (!versions) {
    throw new Error('Versions are missing.');
  }
  if (!versions.node) {
    throw new Error('Node.js version is missing.');
  }
  if (!versions.wolkenkit) {
    throw new Error('wolkenkit version is missing.');
  }
  if (!twitterHandles) {
    throw new Error('Twitter handles are missing.');
  }
  if (!twitterCredentials) {
    throw new Error('Twitter credentials are missing.');
  }
  if (!twitterCredentials.consumerKey) {
    throw new Error('Twitter consumer key is missing.');
  }
  if (!twitterCredentials.consumerSecret) {
    throw new Error('Twitter consumer secret is missing.');
  }
  if (!twitterCredentials.accessTokenKey) {
    throw new Error('Twitter access token key is missing.');
  }
  if (!twitterCredentials.accessTokenSecret) {
    throw new Error('Twitter access token secret is missing.');
  }
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Announcing on Twitter...');

  if (mode !== 'release') {
    return buntstift.info('Skipping update due to simulation mode.');
  }

  const twitter = new Twitter({
    /* eslint-disable camelcase */
    consumer_key: twitterCredentials.consumerKey,
    consumer_secret: twitterCredentials.consumerSecret,
    access_token_key: twitterCredentials.accessTokenKey,
    access_token_secret: twitterCredentials.accessTokenSecret
    /* eslint-enable camelcase */
  });

  await twitter.post('statuses/update', { status: `Yay, version ${versions.wolkenkit} of #wolkenkit, our #cqrs and #eventsourcing framework for #javascript and #nodejs, has been released 🦄! https://docs.wolkenkit.io/${versions.wolkenkit}/getting-started/updating-wolkenkit/changelog/` });

  if (twitterHandles.length > 0) {
    const community = arrayJoinConjunction(twitterHandles);

    await twitter.post('statuses/update', { status: `Special thanks to ${community} for your help to make #wolkenkit ${versions.wolkenkit} happen ❤️🎉🎊🦄🌈` });
  }
};

module.exports = announceOnTwitter;
