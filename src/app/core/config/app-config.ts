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

  if (!shellEnv) {
    return '';
  }

  return shellEnv.newsFileBaseUrl || shellEnv.storageFileBaseUrl || '';
}

export function getS3DomainUrl(): string {
  const shellEnv = (window as any).__env;

  if (!shellEnv) {
    return '';
  }

  return (
    shellEnv.s3DomainUrl ||
    shellEnv.s3DomainURL ||
    shellEnv.s3Domain ||
    shellEnv.storageFileBaseUrl ||
    ''
  );
}
