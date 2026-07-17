'use client';

import { useRouter } from 'next/navigation';

export default function AccessIssue() {
  const router = useRouter();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'var(--background-color)',
    }}>
      <div style={{
        background: 'var(--surface-color)',
        border: '4px solid #000',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '8px 8px 0 #000',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 900,
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Access Denied
        </h2>
        <p style={{
          fontSize: '16px',
          marginBottom: '32px',
          fontFamily: 'var(--mono-font)'
        }}>
          There is an access issue. You may not have permission to read this record, or it does not exist.
        </p>
        <button
          onClick={() => router.push('/')}
          className="btn-primary-brutal"
          style={{ width: '100%', padding: '12px', fontSize: '16px' }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
