// js/config.js
// Application configuration details

export const CONFIG = {
  // If empty string, uses relative '/api' endpoints
  getApiUrl: () => {
    return localStorage.getItem('api_base_url') || '';
  },
  
  setApiUrl: (url) => {
    if (url && !url.endsWith('/')) {
      localStorage.setItem('api_base_url', url);
    } else {
      localStorage.setItem('api_base_url', url || '');
    }
  }
};
