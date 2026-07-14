// worker/index.js
// Cloudflare Worker entrypoint

import { handleRequest } from './routes.js';
import { errorResponse } from './helpers.js';

export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env);
    } catch (err) {
      console.error('Unhandled worker exception:', err);
      return errorResponse('Internal Server Error: ' + err.message, 500);
    }
  }
};
