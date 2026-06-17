'use client';

export async function secureFetch(url: string, options: RequestInit = {}) {
  const hasBody = options.body !== undefined && options.body !== null;
  const headers = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { 
    ...options, 
    headers,
    credentials: 'include' // Ensure cookies are sent
  });
  
  if (res.status === 401 || res.status === 403) {
    let msg = 'Security Restricted';
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch (e) {}
    throw new Error(msg);
  }

  return res;
}
