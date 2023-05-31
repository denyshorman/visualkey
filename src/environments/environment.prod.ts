import { config } from './config';

export const environment = {
  ...config,
  production: true,
  vkApiUrl: 'https://api.visualkey.link',
};
