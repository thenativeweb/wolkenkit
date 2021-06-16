import { GetApiBaseParameters } from './GetApiBaseParameters';
import { Application } from 'express';
declare const getApiBase: ({ request, response }: GetApiBaseParameters) => Promise<Application>;
export { getApiBase };
