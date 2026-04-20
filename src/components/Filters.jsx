import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';

export default function Filters({ filtros, onChange }) {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    async function fetchTodos() {
      let allData = [];
      let page = 0;
      const PAGE_SIZE = 1000;

      while (true) {
        const { data, error } = await supabase
          .from('fianzas')
          .select('sucursal,analytics_agente,estado_contrato,categoria_garantia')
          .not('lat', 'is', null)
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error || !data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < PAGE_SIZE) break;
        page++;
      }

      setTodos(allData);
    }
    fetchTodos();
  }, []);

  const opciones = useMemo(() => {
    const opcionesPara = (campo) => {
      let base = todos;
      if (campo !== 'sucursal' && filtros.sucursal)                 base = base.filter(d => d.sucursal === filtros.sucursal);
      if (campo !== 'analytics_agente' && filtros.analytics_agente) base = base.filter(d => d.analytics_agente === filtros.analytics_agente);
      if (campo !== 'estado' && filtros.estado)                     base = base.filter(d => d.estado_contrato === filtros.estado);
      if (campo !== 'categoria' && filtros.categoria)               base = base.filter(d => d.categoria_garantia === filtros.categoria);
      return base;
    };

    return {
      sucursales: [...new Set(opcionesPara('sucursal').map(d => d.sucursal).filter(Boolean))].sort(),
      agentes:    [...new Set(opcionesPara('analytics_agente').map(d => d.analytics_agente).filter(Boolean))].sort(),
      estados:    [...new Set(opcionesPara('estado').map(d => d.estado_contrato).filter(Boolean))].sort(),
      categorias: [...new Set(opcionesPara('categoria').map(d => d.categoria_garantia).filter(Boolean))].sort(),
    };
  }, [todos, filtros]);

  const set = (key, value) => onChange({ ...filtros, [key]: value || undefined });

  const style = {
    wrap:  { width: '260px', background: 'white', padding: '16px', overflowY: 'auto', borderRight: '1px solid #e0e0e0' },
    title: { fontWeight: 700, fontSize: '14px', color: '#1a1a2e', marginBottom: '4px' },
    label: { display: 'block', fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '4px', marginTop: '14px', textTransform: 'uppercase', letterSpacing: '0.4px' },
    sel:   { width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', background: 'white', cursor: 'pointer' },
    btn:   { width: '100%', marginTop: '20px', padding: '9px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
    badge: { display: 'inline-block', marginLeft: '6px', background: '#e0e7ff', color: '#3730a3', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 600 },
  };

  const activeCount = Object.values(filtros).filter(Boolean).length;

  return (
    <div style={style.wrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={style.title}>Filtros</p>
        {activeCount > 0 && (
          <span style={style.badge}>{activeCount} activo{activeCount > 1 ? 's' : ''}</span>
        )}
      </div>

      <label style={style.label}>Sucursal</label>
      <select style={style.sel} value={filtros.sucursal ?? ''} onChange={e => set('sucursal', e.target.value)}>
        <option value="">Todas ({opciones.sucursales.length})</option>
        {opciones.sucursales.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <label style={style.label}>Comercial</label>
      <select style={style.sel} value={filtros.analytics_agente ?? ''} onChange={e => set('analytics_agente', e.target.value)}>
        <option value="">Todos ({opciones.agentes.length})</option>
        {opciones.agentes.map(a => <option key={a} value={a}>{a}</option>)}
      </select>

      <label style={style.label}>Estado contrato</label>
      <select style={style.sel} value={filtros.estado ?? ''} onChange={e => set('estado', e.target.value)}>
        <option value="">Todos ({opciones.estados.length})</option>
        {opciones.estados.map(e => <option key={e} value={e}>{e}</option>)}
      </select>

      <label style={style.label}>Categoría</label>
      <select style={style.sel} value={filtros.categoria ?? ''} onChange={e => set('categoria', e.target.value)}>
        <option value="">Todas ({opciones.categorias.length})</option>
        {opciones.categorias.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <label style={style.label}>Fecha inicio desde</label>
      <input type="date" style={style.sel} value={filtros.fechaDesde ?? ''} onChange={e => set('fechaDesde', e.target.value)} />

      <label style={style.label}>Fecha inicio hasta</label>
      <input type="date" style={style.sel} value={filtros.fechaHasta ?? ''} onChange={e => set('fechaHasta', e.target.value)} />

      <button style={style.btn} onClick={() => onChange({})}>
        Limpiar filtros
      </button>
    </div>
  );
}
