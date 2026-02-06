const normalizeRequestUrl = (url?: string) => {
  if (!url) {
    throw new Error("Missing request URL");
  }
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("Empty request URL");
  }
  return trimmed;
};

export async function safeFetch(url?: string, init?: RequestInit) {
  const requestUrl = normalizeRequestUrl(url);
  const response = await fetch(requestUrl, init);
  if (!response.ok) {
    throw new Error(
      `Request to ${requestUrl} failed with status ${response.status}`,
    );
  }
  return response;
}

export async function safeFetchJson<T = unknown>(url?: string, init?: RequestInit) {
  const response = await safeFetch(url, init);
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON response from ${response.url}`);
  }
}
