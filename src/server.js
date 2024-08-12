import http from 'http';
import app from './app.js';

export const createServer = () => {
  return http.createServer(app);
};
