import { useState } from 'react';
import Map from './components/Map.jsx';
import Filters from './components/Filters.jsx';
import MapInmobiliarias from './components/MapInmobiliarias.jsx';
import FiltersInmo from './components/FiltersInmo.jsx';
import Login from './components/Login.jsx';
import { useFianzas } from './hooks/useFianzas.js';
import { useInmobiliarias } from './hooks/useInmobiliarias.js';

export default function App() {
  const [auth, setAuth]           = useState(!!sessionStorage.getItem('gy_auth'));
  const [tab, setTab]             = useState('fianzas');
  const [filtros, setFiltros]     = useState({});
  const [filtrosInmo, setFiltrosInmo] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const { fianzas, sinUbicacion, loading: loadingF }         = useFianzas(filtros);
  const { inmobiliarias, loading: loadingI }                  = useInmobiliarias(filtrosInmo);

  if (!auth) return <Login onLogin={() => setAuth(true)} />;

  const activeFiltros = tab === 'fianzas' ? filtros : filtrosInmo;
  const activeCount   = Object.values(activeFiltros).filter(Boolean).length;

  const statsF = {
    total:        fianzas.length + sinUbicacion,
    sinUbicacion: sinUbicacion,
    totalAmount:  fianzas.reduce((s, f) => s + (f.amount ?? 0), 0),
  };

  const statsI = {
    total:       inmobiliarias.length,
    totalAmount: inmobiliarias.reduce((s, i) => s + (i.total_amount ?? 0), 0),
  };

  const loading = tab === 'fianzas' ? loadingF : loadingI;

  return (
    <div style={{ display:'flex', height:'100vh', flexDirection:'column' }}>
      <header style={{
        background:'linear-gradient(135deg, #15235f 0%, #0d1640 100%)', color:'white',
        padding:'10px 24px', display:'flex',
        alignItems:'center', justifyContent:'space-between',
        zIndex:1001, position:'relative', gap:'12px',
        boxShadow:'0 2px 12px rgba(13,22,64,0.25)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
          <img src="/logo-wordmark.png" alt="GarantíaYa" style={{ height:'26px', width:'auto', filter:'brightness(0) invert(1)' }} />
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'4px', background:'rgba(255,255,255,0.1)', borderRadius:'8px', padding:'3px' }}>
          <button
            onClick={() => { setTab('fianzas'); setShowFilters(false); }}
            style={{
              padding:'6px 14px', borderRadius:'6px', border:'none', cursor:'pointer',
              fontSize:'12px', fontWeight:600,
              background: tab === 'fianzas' ? 'white' : 'transparent',
              color: tab === 'fianzas' ? '#15235f' : 'rgba(255,255,255,0.7)',
            }}
          >
            🏠 Pólizas
          </button>
          <button
            onClick={() => { setTab('inmobiliarias'); setShowFilters(false); }}
            style={{
              padding:'6px 14px', borderRadius:'6px', border:'none', cursor:'pointer',
              fontSize:'12px', fontWeight:600,
              background: tab === 'inmobiliarias' ? 'white' : 'transparent',
              color: tab === 'inmobiliarias' ? '#15235f' : 'rgba(255,255,255,0.7)',
            }}
          >
            🏢 Inmobiliarias
          </button>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              background: showFilters ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              border:'1px solid rgba(255,255,255,0.3)',
              color:'white', padding:'7px 14px', borderRadius:'8px',
              cursor:'pointer', fontSize:'13px', fontWeight:600,
              display:'flex', alignItems:'center', gap:'6px',
            }}
          >
            ⚙️ Filtros
            {activeCount > 0 && (
              <span style={{ background:'#e2231a', borderRadius:'10px', padding:'1px 6px', fontSize:'11px' }}>
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { sessionStorage.removeItem('gy_auth'); setAuth(false); }}
            style={{
              background:'rgba(255,255,255,0.1)',
              border:'1px solid rgba(255,255,255,0.2)',
              color:'white', padding:'7px 12px', borderRadius:'8px',
              cursor:'pointer', fontSize:'12px',
            }}
          >
            Salir
          </button>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, overflow:'hidden', position:'relative' }}>
        {showFilters && (
          <>
            <div
              onClick={() => setShowFilters(false)}
              style={{ position:'absolute', inset:0, zIndex:999, background:'rgba(0,0,0,0.4)' }}
            />
            <div style={{
              position:'absolute', top:0, left:0, bottom:0,
              zIndex:1000, width:'280px',
              boxShadow:'4px 0 20px rgba(0,0,0,0.15)', overflowY:'auto',
            }}>
              {tab === 'fianzas'
                ? <Filters filtros={filtros} onChange={setFiltros} onClose={() => setShowFilters(false)} />
                : <FiltersInmo filtros={filtrosInmo} onChange={setFiltrosInmo} onClose={() => setShowFilters(false)} />
              }
            </div>
          </>
        )}
        <div style={{ flex:1 }}>
          {loading
            ? <div style={{ display:'flex', flexDirection:'column', gap:'14px', alignItems:'center', justifyContent:'center', height:'100%' }}>
                <div style={{ width:'38px', height:'38px', border:'3px solid #e6e9f4', borderTopColor:'#15235f', borderRadius:'50%', animation:'gySpin 0.8s linear infinite' }} />
                <span style={{ fontSize:'15px', color:'#15235f', fontWeight:600 }}>Cargando datos…</span>
              </div>
            : tab === 'fianzas'
              ? <Map fianzas={fianzas} stats={statsF} filtersOpen={showFilters} />
              : <MapInmobiliarias inmobiliarias={inmobiliarias} stats={statsI} filtersOpen={showFilters} />
          }
        </div>
      </div>
    </div>
  );
}
