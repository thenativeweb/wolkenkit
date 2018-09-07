'use strict';

const defekt = require('defekt');

const errors = defekt([
  'AddressMismatch',
  'ApplicationAlreadyRunning',
  'ApplicationBuilding',
  'ApplicationNotRunning',
  'ApplicationPartiallyRunning',
  'ApplicationTerminating',
  'ApplicationVerifyingConnections',
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
  'EnvironmentNotAufwind',
  'EnvironmentNotFound',
  'EnvironmentVariableMissing',
  'ExecutableFailed',
  'ExecutableNotFound',
  'FileAccessModeTooOpen',
  'FileNotAccessible',
  'FileNotFound',
  'JsonMalformed',
  'OutputMalformed',
  'PortsNotAvailable',
  'ProtocolInvalid',
  'RequestFailed',
  'RuntimeAlreadyInstalled',
  'RuntimeError',
  'RuntimeInUse',
  'RuntimeNotInstalled',
  'UnknownError',
  'UrlMalformed',
  'VersionMismatch',
  'VersionAlreadyInstalled',
  'VersionNotFound'
]);

module.exports = errors;
