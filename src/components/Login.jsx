import { useState, useEffect } from 'react';

const PASSWORD = import.meta.env.VITE_APP_PASSWORD;

function useIsNarrow(bp = 860) {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < bp
  );
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < bp);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [bp]);
  return narrow;
}

const NAVY      = '#15235f';
const NAVY_DEEP = '#0d1640';
const ROYAL     = '#1c3fae';
const RED       = '#e2231a';

const DIRECTIONS = [
  { id: 'bienvenido', label: 'Bienvenido' },
  { id: 'marca',      label: 'Marca' },
  { id: 'claro',      label: 'Claro' },
];

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [dir, setDir]           = useState(
    () => localStorage.getItem('gy_login_dir') || 'bienvenido'
  );

  const pickDir = (id) => { setDir(id); localStorage.setItem('gy_login_dir', id); };

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

  const formProps = { password, setPassword, error, setError, loading, handleSubmit };

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {dir === 'bienvenido' && <Bienvenido {...formProps} />}
      {dir === 'marca'      && <Marca {...formProps} />}
      {dir === 'claro'      && <Claro {...formProps} />}

      {/* Style switcher */}
      <div style={{
        position: 'fixed', bottom: '18px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: '6px', zIndex: 50,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0,0,0,0.08)', borderRadius: '999px',
        padding: '5px 6px 5px 14px', boxShadow: '0 8px 28px rgba(13,22,64,0.18)',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#8a90a6', letterSpacing: '0.04em', marginRight: '4px' }}>
          ESTILO
        </span>
        {DIRECTIONS.map(d => (
          <button
            key={d.id}
            onClick={() => pickDir(d.id)}
            style={{
              border: 'none', cursor: 'pointer', borderRadius: '999px',
              padding: '6px 14px', fontSize: '12px', fontWeight: 600,
              transition: 'all .15s',
              background: dir === d.id ? NAVY : 'transparent',
              color: dir === d.id ? '#fff' : '#5a6178',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Shared form pieces ---------- */

function Field({ password, setPassword, error, setError, dark }) {
  return (
    <div>
      <label style={{
        fontSize: '12px', fontWeight: 600, letterSpacing: '0.03em',
        color: dark ? 'rgba(255,255,255,0.7)' : '#5a6178',
        display: 'block', marginBottom: '8px', textTransform: 'uppercase',
      }}>
        Contraseña
      </label>
      <input
        type="password"
        value={password}
        onChange={e => { setPassword(e.target.value); setError(''); }}
        placeholder="Introduce la contraseña"
        autoFocus
        autoComplete="current-password"
        style={{
          width: '100%', padding: '13px 15px', borderRadius: '12px',
          border: `1.5px solid ${error ? RED : dark ? 'rgba(255,255,255,0.25)' : '#e2e5ee'}`,
          background: dark ? 'rgba(255,255,255,0.08)' : '#fff',
          color: dark ? '#fff' : NAVY,
          fontSize: '15px', outline: 'none', boxSizing: 'border-box',
          transition: 'border-color .15s',
        }}
      />
      {error && <p style={{ color: RED, fontSize: '12.5px', marginTop: '8px', fontWeight: 500 }}>{error}</p>}
    </div>
  );
}

function SubmitButton({ loading, password, accent = NAVY }) {
  const disabled = loading || !password;
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
        background: disabled ? '#c3c8d6' : accent,
        color: '#fff', fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform .12s, background .15s',
        boxShadow: disabled ? 'none' : `0 10px 24px ${accent}40`,
      }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {loading ? 'Verificando…' : 'Entrar'}
    </button>
  );
}

/* ---------- Direction A: Bienvenido (split editorial) ---------- */

function Bienvenido({ handleSubmit, ...rest }) {
  const narrow = useIsNarrow();
  return (
    <div style={{ display: 'flex', flexDirection: narrow ? 'column' : 'row', height: '100%', width: '100%' }}>
      {/* Left: editorial panel */}
      <div style={{
        flex: narrow ? '0 0 auto' : '1.15', position: 'relative', display: 'flex', flexDirection: 'column',
        justifyContent: narrow ? 'flex-start' : 'space-between',
        gap: narrow ? '18px' : 0,
        padding: narrow ? '30px 26px' : '46px 56px',
        background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
        color: '#fff', overflow: 'hidden',
      }}>
        <RoofPattern />
        <img src="/logo-wordmark.png" alt="GarantíaYa"
             style={{ height: narrow ? '28px' : '34px', width: 'auto', filter: 'brightness(0) invert(1)', position: 'relative' }} />

        <div style={{ position: 'relative', animation: 'gyFadeUp .6s ease both' }}>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.65)', marginBottom: '10px' }}>
            Llegaste,
          </p>
          <h1 style={{ fontSize: narrow ? 'clamp(36px, 12vw, 52px)' : 'clamp(40px, 5vw, 68px)', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.02em', margin: 0 }}>
            Bienvenido.
          </h1>
          <div style={{ width: '64px', height: '4px', background: RED, borderRadius: '2px', margin: narrow ? '16px 0' : '24px 0' }} />
          <p style={{ fontSize: narrow ? '15px' : '17px', lineHeight: 1.5, color: 'rgba(255,255,255,0.75)', maxWidth: '380px' }}>
            La tranquilidad del propietario,<br />el respaldo del inquilino.
          </p>
        </div>

        {!narrow && (
          <p style={{ position: 'relative', fontSize: '12.5px', color: 'rgba(255,255,255,0.45)' }}>
            Mapa de Ventas · Acceso restringido
          </p>
        )}
      </div>

      {/* Right: form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f4f6fb', padding: narrow ? '28px 24px' : '32px',
      }}>
        <form onSubmit={handleSubmit} style={{
          width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '22px',
          animation: 'gyFadeUp .5s ease both',
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: NAVY, margin: '0 0 4px' }}>Iniciar sesión</h2>
            <p style={{ fontSize: '14px', color: '#8a90a6', margin: 0 }}>Accedé al mapa de ventas</p>
          </div>
          <Field {...rest} />
          <SubmitButton loading={rest.loading} password={rest.password} accent={NAVY} />
          <p style={{ fontSize: '11.5px', color: '#aab0c2', textAlign: 'center', marginTop: '4px' }}>
            © {new Date().getFullYear()} GarantíaYa
          </p>
        </form>
      </div>
    </div>
  );
}

/* ---------- Direction B: Marca (bold navy, centered) ---------- */

function Marca({ handleSubmit, ...rest }) {
  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(circle at 30% 20%, ${ROYAL}33 0%, transparent 45%), linear-gradient(160deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
      position: 'relative', overflow: 'hidden', padding: '24px',
    }}>
      <RoofPattern big />
      <div style={{
        position: 'relative', width: '100%', maxWidth: '400px',
        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.14)', borderRadius: '24px',
        padding: '44px 40px', textAlign: 'center',
        boxShadow: '0 30px 80px rgba(0,0,0,0.4)', animation: 'gyFadeUp .5s ease both',
      }}>
        <div style={{
          width: '88px', height: '88px', margin: '0 auto 22px', borderRadius: '22px',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 14px 34px rgba(0,0,0,0.3)',
        }}>
          <img src="/logo-monogram.png" alt="GarantíaYa" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          GarantíaYa
        </h1>
        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.6)', margin: '0 0 30px' }}>
          Mapa de Ventas · Acceso restringido
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
          <Field {...rest} dark />
          <SubmitButton loading={rest.loading} password={rest.password} accent={RED} />
        </form>
        <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', marginTop: '24px' }}>
          © {new Date().getFullYear()} GarantíaYa
        </p>
      </div>
    </div>
  );
}

/* ---------- Direction C: Claro (minimal light) ---------- */

function Claro({ handleSubmit, ...rest }) {
  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fbfcfe', position: 'relative', overflow: 'hidden', padding: '24px',
    }}>
      {/* subtle roof watermark */}
      <div style={{ position: 'absolute', right: '-80px', bottom: '-80px', opacity: 0.05 }}>
        <RoofMark size={420} color={NAVY} />
      </div>
      <div style={{ position: 'absolute', top: '32px', left: '40px' }}>
        <img src="/logo-wordmark.png" alt="GarantíaYa" style={{ height: '30px', width: 'auto' }} />
      </div>

      <div style={{
        position: 'relative', width: '100%', maxWidth: '400px',
        background: '#fff', borderRadius: '24px', padding: '44px 40px',
        border: '1px solid #eef1f7', boxShadow: '0 24px 60px rgba(21,35,95,0.08)',
        animation: 'gyFadeUp .5s ease both',
      }}>
        <div style={{ width: '56px', height: '4px', background: RED, borderRadius: '2px', marginBottom: '22px' }} />
        <h1 style={{ fontSize: '27px', fontWeight: 800, color: NAVY, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          Hola de nuevo
        </h1>
        <p style={{ fontSize: '14px', color: '#8a90a6', margin: '0 0 30px' }}>
          Accedé al mapa de ventas de GarantíaYa
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Field {...rest} />
          <SubmitButton loading={rest.loading} password={rest.password} accent={NAVY} />
        </form>
        <p style={{ fontSize: '11.5px', color: '#aab0c2', textAlign: 'center', marginTop: '24px' }}>
          © {new Date().getFullYear()} GarantíaYa · Acceso restringido
        </p>
      </div>
    </div>
  );
}

/* ---------- Decorative roof motif ---------- */

function RoofMark({ size = 80, color = '#fff', stroke = 7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 52 L34 30 L58 52 L58 78 L10 78 Z" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
      <path d="M40 46 L64 24 L90 46 L90 74 L52 74" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function RoofPattern({ big }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: big ? '-60px' : '-40px', right: big ? '-40px' : '-30px', opacity: 0.07 }}>
        <RoofMark size={big ? 380 : 260} color="#fff" stroke={4} />
      </div>
      <div style={{ position: 'absolute', bottom: '-50px', left: '-30px', opacity: 0.05 }}>
        <RoofMark size={big ? 300 : 200} color="#fff" stroke={4} />
      </div>
    </div>
  );
}
