'use strict';

const fileNamePrefix = 'events-',
      fileNameRegex = /^events-\d{16}\.json$/u,
      fileNameSuffix = '.json',
      fileNumberLength = 16;

const eventFile = {
  getFileName (fileNumber) {
    if (!fileNumber) {
      throw new Error('File number is missing.');
    }

    const paddedFileNumber = String(fileNumber).padStart(fileNumberLength, '0');
    const fileName = `${fileNamePrefix}${paddedFileNumber}${fileNameSuffix}`;

    return fileName;
  },

  getFileNumber (fileName) {
    if (!fileName) {
      throw new Error('File name is missing.');
    }

    if (!eventFile.isValidFileName(fileName)) {
      throw new Error('Invalid file name.');
    }

    const paddedFileNumber = fileName.slice(fileNamePrefix.length, -fileNameSuffix.length);
    const fileNumber = Number(paddedFileNumber);

    return fileNumber;
  },

  isValidFileName (fileName) {
    if (!fileName) {
      throw new Error('File name is missing.');
    }

    const isValid = fileNameRegex.test(fileName);

    return isValid;
  }
};

module.exports = eventFile;
