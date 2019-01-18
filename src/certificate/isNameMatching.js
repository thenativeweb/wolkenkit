'use strict';

const numberOfDots = function (text) {
  return text.split('.').length - 1;
};

const isMatching = function (left, right) {
  if (left === right) {
    return true;
  }
  if (left.startsWith('*.')) {
    if (numberOfDots(left) !== numberOfDots(right)) {
      return false;
    }

    const fixedPartOfLeft = left.substring(2),
          fixedPartOfRight = right.substring(right.indexOf('.') + 1);

    if (fixedPartOfLeft === fixedPartOfRight) {
      return true;
    }
  }

  return false;
};

const isNameMatching = function ({ certificate, name }) {
  if (!certificate) {
    throw new Error('Certificate is missing.');
  }
  if (!name) {
    throw new Error('Name is missing.');
  }

  if (isMatching(certificate.subject.commonName, name)) {
    return true;
  }
  if (certificate.subject.alternativeNames && certificate.subject.alternativeNames.find(san => isMatching(san, name))) {
    return true;
  }

  return false;
};

module.exports = isNameMatching;
