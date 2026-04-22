import { useState } from 'react';

const PASSWORD = import.meta.env.VITE_APP_PASSWORD;

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === PASSWORD) {
        sessionStorage.setItem('gy_auth', 'true');
        onLogin();
      } else {
        setError('Contraseña incorrecta');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f5f5',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '40px', width: '360px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
      }}>
        {/* Logo */}
        <img src="/favicon.png" alt="GarantíaYa" style={{ width: '72px', height: '72px', borderRadius: '12px' }} />

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>
            GarantíaYa
          </h1>
          <p style={{ fontSize: '13px', color: '#888' }}>Mapa de Ventas — Acceso restringido</p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Introduce la contraseña"
              autoFocus
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: '8px', border: `1px solid ${error ? '#ef4444' : '#ddd'}`,
                fontSize: '14px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%', padding: '11px',
              background: loading || !password ? '#ccc' : '#1a1a2e',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: loading || !password ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center' }}>
          © {new Date().getFullYear()} GarantíaYa
        </p>
      </div>
    </div>
  );
}
