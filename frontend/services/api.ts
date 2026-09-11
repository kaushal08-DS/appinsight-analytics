const API = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");


/**
 * Generic API request helper.
 *
 * In local development:
 *   http://localhost:8000
 *
 * In production:
 *   NEXT_PUBLIC_API_URL
 */
export async function api<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = response.statusText;

    try {
      const data = await response.json();

      if (data?.detail) {
        message = data.detail;
      }
    } catch {
      // Response was not JSON.
      // Keep the HTTP status text.
    }

    throw new Error(
      `${response.status} ${message}`
    );
  }

  return response.json();
}


export { API };