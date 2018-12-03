'use strict';

var fileNamePrefix = 'events-',
    fileNameRegex = /^events-\d{16}\.json$/,
    fileNameSuffix = '.json',
    fileNumberLength = 16;
var eventFile = {
  getFileName: function getFileName(fileNumber) {
    if (!fileNumber) {
      throw new Error('File number is missing.');
    }

    var paddedFileNumber = String(fileNumber).padStart(fileNumberLength, '0');
    var fileName = "".concat(fileNamePrefix).concat(paddedFileNumber).concat(fileNameSuffix);
    return fileName;
  },
  getFileNumber: function getFileNumber(fileName) {
    if (!fileName) {
      throw new Error('File name is missing.');
    }

    if (!eventFile.isValidFileName(fileName)) {
      throw new Error('Invalid file name.');
    }

    var paddedFileNumber = fileName.slice(fileNamePrefix.length, -fileNameSuffix.length);
    var fileNumber = Number(paddedFileNumber);
    return fileNumber;
  },
  isValidFileName: function isValidFileName(fileName) {
    if (!fileName) {
      throw new Error('File name is missing.');
    }

    var isValid = fileNameRegex.test(fileName);
    return isValid;
  }
};
module.exports = eventFile;