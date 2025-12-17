export type IdentifyResponse = {
  success: boolean;
  data?: any;
  error?: { code: number; message: string; details?: any };
};

export async function identifyPlant(file: { uri: string; mimeType: string; name: string }): Promise<IdentifyResponse> {
  const backendUrl = (process.env.EXPO_PUBLIC_BACKEND_URL as string) || 'http://localhost:3000';
  const url = `${backendUrl}/identify`;

  const form = new FormData();
  form.append('image', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as any);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: form,
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON from server (status ${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(json?.error?.message || `HTTP ${res.status}`);
  }
  return json;
}
