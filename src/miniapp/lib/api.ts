export interface MeResponse {
  name: string | null;
}

export async function fetchMe(initData: string): Promise<MeResponse> {
  const res = await fetch('/api/miniapp/me', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}
