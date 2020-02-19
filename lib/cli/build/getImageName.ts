import { errors } from '../../common/errors';

const getImageName = function ({ name, version, mode, imagePrefix }: {
  name: string;
  version: string;
  mode: string;
  imagePrefix?: string;
}): string {
  let imageName = '';

  if (imagePrefix) {
    imageName += imagePrefix;

    if (!imagePrefix.endsWith('/')) {
      imageName += '/';
    }
  }

  imageName += name;

  switch (mode) {
    case 'development':
      imageName += ':latest';
      break;
    case 'production':
      imageName += `:${version}`;
      break;
    default:
      throw new errors.InvalidOperation();
  }

  return imageName;
};

export { getImageName };
