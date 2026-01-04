'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!image) return;

    try {
      setLoading(true);
      setError(null);
      setReport(null);

      const formData = new FormData();
      formData.append('image', image);

      const res = await fetch('http://localhost:3000/identify', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (json?.success && typeof json.data?.identified === 'string') {
        setReport(json.data.identified);
      } else {
        setError('Invalid response from server');
      }
    } catch {
      setError('Failed to identify plant');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
      <h1>Medicinal Plant Identification</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
      />

      <br /><br />

      <button onClick={handleSubmit} disabled={!image || loading}>
        {loading ? 'Identifying...' : 'Identify Plant'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {report && (
        <div style={{ marginTop: 40 }}>
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>
      )}
    </main>
  );
}
