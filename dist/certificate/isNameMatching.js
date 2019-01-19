'use strict';

var numberOfDots = function numberOfDots(text) {
  return text.split('.').length - 1;
};

var isMatching = function isMatching(left, right) {
  if (left === right) {
    return true;
  }

  if (left.startsWith('*.')) {
    if (numberOfDots(left) !== numberOfDots(right)) {
      return false;
    }

    var fixedPartOfLeft = left.substring(2),
        fixedPartOfRight = right.substring(right.indexOf('.') + 1);

    if (fixedPartOfLeft === fixedPartOfRight) {
      return true;
    }
  }

  return false;
};

var isNameMatching = function isNameMatching(_ref) {
  var certificate = _ref.certificate,
      name = _ref.name;

  if (!certificate) {
    throw new Error('Certificate is missing.');
  }

  if (!name) {
    throw new Error('Name is missing.');
  }

  if (isMatching(certificate.subject.commonName, name)) {
    return true;
  }

  if (certificate.subject.alternativeNames && certificate.subject.alternativeNames.find(function (san) {
    return isMatching(san, name);
  })) {
    return true;
  }

  return false;
};

module.exports = isNameMatching;