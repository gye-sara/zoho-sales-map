import { useState } from 'react';
import Map from './components/Map.jsx';
import Filters from './components/Filters.jsx';
import { useFianzas } from './hooks/useFianzas.js';

export default function App() {
  const [filtros, setFiltros] = useState({});
  const { fianzas, sinUbicacion, loading } = useFianzas(filtros);

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
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600 }}>GarantíaYa — Mapa de Ventas</h1>
      </header>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Filters filtros={filtros} onChange={setFiltros} />
        <div style={{ flex: 1 }}>
          {loading
            ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:'16px', color:'#666' }}>Cargando datos...</div>
            : <Map fianzas={fianzas} stats={stats} />
          }
        </div>
      </div>
    </div>
  );
}
