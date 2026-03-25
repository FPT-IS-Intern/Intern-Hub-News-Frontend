export function getBaseUrl(): string {
  const shellEnv = (window as any).__env;

  if (shellEnv && shellEnv.apiUrl) {
    return shellEnv.apiUrl;
  }

  console.error('Shell environment not found! Application must be run within the Shell App.');
  return '';
}

export function getFileBaseUrl(): string {
  const shellEnv = (window as any).__env;

  if (shellEnv && shellEnv.newsFileBaseUrl) {
    return shellEnv.newsFileBaseUrl;
  }

  return '';
}
