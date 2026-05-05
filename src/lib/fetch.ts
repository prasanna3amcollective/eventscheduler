'use client';

export async function secureFetch(url: string, options: RequestInit = {}) {
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json'
  };

  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401 || res.status === 403) {
    const data = await res.json();
    throw new Error(data.error || 'Security Restricted');
  }

  return res;
}
