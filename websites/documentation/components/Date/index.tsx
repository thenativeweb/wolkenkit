import formatDate from 'date-fns/format';
import React, { FunctionComponent, ReactElement } from 'react';

interface DateProps {
  className: string;
  day: string;
  month: string;
  year: string;
  format?: string;
}

const Date: FunctionComponent<DateProps> = ({ className, year, month, day, format = 'dd.MM.yyyy' }): ReactElement => {
  const dateToRender = new global.Date(Number(year), Number(month) - 1, Number(day));

  return (
    React.createElement('span', { className }, formatDate(dateToRender, format))
  );
};

export { Date };
