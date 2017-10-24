'use strict';

const defekt = require('defekt');

const errors = defekt([
  'AddressMismatch',
  'ApplicationAlreadyRunning',
  'ApplicationNotRunning',
  'ApplicationPartiallyRunning',
  'CertificateExpired',
  'CertificateMismatch',
  'CertificateNotYetValid',
  'CodeMalformed',
  'ConfigurationMalformed',
  'ConfigurationNotFound',
  'ConnectionRefused',
  'DirectoryNotEmpty',
  'DirectoryNotFound',
  'DockerNotReachable',
  'EnvironmentNotFound',
  'EnvironmentVariableMissing',
  'ExecutableFailed',
  'ExecutableNotFound',
  'FileNotAccessible',
  'FileNotFound',
  'JsonMalformed',
  'OutputMalformed',
  'PortsNotAvailable',
  'ProtocolInvalid',
  'RequestFailed',
  'RuntimeInUse',
  'RuntimeAlreadyInstalled',
  'RuntimeNotInstalled',
  'UnknownError',
  'UrlMalformed',
  'VersionMismatch',
  'VersionAlreadyInstalled',
  'VersionNotFound'
]);

module.exports = errors;
