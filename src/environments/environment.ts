import { config } from './config';

export const environment = {
  ...config,
  production: false,
  vkApiUrl: 'http://localhost:8080',
};
