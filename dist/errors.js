'use strict';

var defekt = require('defekt');

var errors = defekt(['AddressMismatch', 'ApplicationAlreadyRunning', 'ApplicationNotRunning', 'ApplicationPartiallyRunning', 'CertificateExpired', 'CertificateMismatch', 'CertificateNotYetValid', 'CodeMalformed', 'ConfigurationMalformed', 'ConfigurationNotFound', 'ConnectionRefused', 'DirectoryNotEmpty', 'DirectoryNotFound', 'DockerNotReachable', 'EnvironmentNotFound', 'ExecutableFailed', 'ExecutableNotFound', 'FileNotAccessible', 'FileNotFound', 'JsonMalformed', 'OutputMalformed', 'PortsNotAvailable', 'RuntimeInUse', 'RuntimeAlreadyInstalled', 'RuntimeNotInstalled', 'UnknownError', 'UrlMalformed', 'VersionMismatch', 'VersionAlreadyInstalled', 'VersionNotFound']);

module.exports = errors;