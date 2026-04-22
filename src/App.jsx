import { useState } from 'react';
import Map from './components/Map.jsx';
import Filters from './components/Filters.jsx';
import Login from './components/Login.jsx';
import { useFianzas } from './hooks/useFianzas.js';

export default function App() {
  const [auth, setAuth]           = useState(!!sessionStorage.getItem('gy_auth'));
  const [filtros, setFiltros]     = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const { fianzas, sinUbicacion, loading } = useFianzas(filtros);

  if (!auth) return <Login onLogin={() => setAuth(true)} />;

  const activeCount = Object.values(filtros).filter(Boolean).length;

  const stats = {
    total:        fianzas.length + sinUbicacion,
    conUbicacion: fianzas.length,
    sinUbicacion: sinUbicacion,
    totalAmount:  fianzas.reduce((s, f) => s + (f.amount ?? 0), 0),
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <header style={{
        background: '#1a1a2e', color: 'white',
        padding: '12px 24px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        zIndex: 1001, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/favicon.png" alt="logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
          <h1 style={{ fontSize: '18px', fontWeight: 600 }}>GarantíaYa — Mapa de Ventas</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              background: showFilters ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white', padding: '7px 14px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            ⚙️ Filtros
            {activeCount > 0 && (
              <span style={{ background: '#6366f1', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { sessionStorage.removeItem('gy_auth'); setAuth(false); }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', padding: '7px 12px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '12px',
            }}
          >
            Salir
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {showFilters && (
          <>
            <div
              onClick={() => setShowFilters(false)}
              style={{ position: 'absolute', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.4)' }}
            />
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              zIndex: 1000, width: '280px',
              boxShadow: '4px 0 20px rgba(0,0,0,0.15)', overflowY: 'auto',
            }}>
              <Filters filtros={filtros} onChange={setFiltros} onClose={() => setShowFilters(false)} />
            </div>
          </>
        )}
        <div style={{ flex: 1 }}>
          {loading
            ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:'16px', color:'#666' }}>Cargando datos...</div>
            : <Map fianzas={fianzas} stats={stats} filtersOpen={showFilters} />
          }
        </div>
      </div>
    </div>
  );
}
