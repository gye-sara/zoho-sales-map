import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import RangoAlquiler from './RangoAlquiler.jsx';

function SearchSelect({ label, value, onChange, options, placeholder }) {
  const [search, setSearch] = useState('');
  const [open, setOpen]     = useState(false);
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const selected = value ?? '';

  return (
    <div style={{ position:'relative', marginBottom:'2px' }}>
      <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#888', marginBottom:'4px', marginTop:'14px', textTransform:'uppercase', letterSpacing:'0.4px' }}>
        {label}
      </label>
      <div
        onClick={() => setOpen(!open)}
        style={{ width:'100%', padding:'7px 8px', borderRadius:'6px', border:`1px solid ${open ? '#6366f1' : '#ddd'}`, fontSize:'13px', background:'white', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}
      >
        <span style={{ color: selected ? '#222' : '#aaa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'200px' }}>
          {selected || placeholder}
        </span>
        <span style={{ color:'#999', fontSize:'10px', flexShrink:0 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ position:'absolute', zIndex:2000, top:'100%', left:0, right:0, background:'white', border:'1px solid #ddd', borderRadius:'6px', boxShadow:'0 4px 16px rgba(0,0,0,0.12)', maxHeight:'220px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder="Buscar..."
            style={{ padding:'8px 10px', border:'none', borderBottom:'1px solid #f0f0f0', fontSize:'12px', outline:'none' }}
          />
          <div style={{ overflowY:'auto', maxHeight:'170px' }}>
            <div
              onClick={() => { onChange(''); setSearch(''); setOpen(false); }}
              style={{ padding:'8px 10px', fontSize:'12px', color:'#999', cursor:'pointer', background: !selected ? '#f5f5f5' : 'white' }}
            >
              {placeholder} ({options.length})
            </div>
            {filtered.map(o => (
              <div
                key={o}
                onClick={() => { onChange(o); setSearch(''); setOpen(false); }}
                style={{ padding:'8px 10px', fontSize:'12px', color:'#222', cursor:'pointer', background: selected === o ? '#ede9fe' : 'white', fontWeight: selected === o ? 600 : 400 }}
              >
                {o}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding:'8px 10px', fontSize:'12px', color:'#aaa' }}>Sin resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Filters({ filtros, onChange, onClose }) {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    async function fetchTodos() {
      let allData = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('fianzas')
          .select('sucursal,analytics_agente,estado_contrato,categoria_garantia,nombre_inmobiliaria')
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
      if (campo !== 'sucursal' && filtros.sucursal)                  base = base.filter(d => d.sucursal === filtros.sucursal);
      if (campo !== 'analytics_agente' && filtros.analytics_agente)  base = base.filter(d => d.analytics_agente === filtros.analytics_agente);
      if (campo !== 'inmobiliaria' && filtros.inmobiliaria)          base = base.filter(d => d.nombre_inmobiliaria === filtros.inmobiliaria);
      if (campo !== 'estado' && filtros.estado)                      base = base.filter(d => d.estado_contrato === filtros.estado);
      if (campo !== 'categoria' && filtros.categoria)                base = base.filter(d => d.categoria_garantia === filtros.categoria);
      return base;
    };
    return {
      sucursales:    [...new Set(opcionesPara('sucursal').map(d => d.sucursal).filter(Boolean))].sort(),
      agentes:       [...new Set(opcionesPara('analytics_agente').map(d => d.analytics_agente).filter(Boolean))].sort(),
      inmobiliarias: [...new Set(opcionesPara('inmobiliaria').map(d => d.nombre_inmobiliaria).filter(Boolean))].sort(),
      estados:       [...new Set(opcionesPara('estado').map(d => d.estado_contrato).filter(Boolean))].sort(),
      categorias:    [...new Set(opcionesPara('categoria').map(d => d.categoria_garantia).filter(Boolean))].sort(),
    };
  }, [todos, filtros]);

  const set = (key, value) => onChange({ ...filtros, [key]: value || undefined });
  const activeCount = Object.values(filtros).filter(Boolean).length;

  const style = {
    wrap:  { width:'280px', background:'white', padding:'16px', height:'100%', overflowY:'auto' },
    label: { display:'block', fontSize:'11px', fontWeight:600, color:'#888', marginBottom:'4px', marginTop:'14px', textTransform:'uppercase', letterSpacing:'0.4px' },
    sel:   { width:'100%', padding:'7px 8px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'13px', background:'white', cursor:'pointer' },
    btn:   { width:'100%', marginTop:'20px', padding:'9px', background:'#1a1a2e', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:600 },
    badge: { display:'inline-block', marginLeft:'6px', background:'#e0e7ff', color:'#3730a3', borderRadius:'10px', padding:'1px 6px', fontSize:'10px', fontWeight:600 },
    section: { marginTop:'16px', paddingTop:'14px', borderTop:'1px solid #f0f0f0' },
    sectionTitle: { fontSize:'11px', fontWeight:700, color:'#1a1a2e', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' },
    checkRow: { display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', cursor:'pointer' },
  };

  return (
    <div style={style.wrap}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <p style={{ fontWeight:700, fontSize:'14px', color:'#1a1a2e', margin:0 }}>Filtros</p>
          {activeCount > 0 && <span style={style.badge}>{activeCount}</span>}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'18px', color:'#999' }}>✕</button>
      </div>

      <SearchSelect label="Sucursal" value={filtros.sucursal} onChange={v => set('sucursal', v)} options={opciones.sucursales} placeholder="Todas las sucursales" />
      <SearchSelect label="Comercial" value={filtros.analytics_agente} onChange={v => set('analytics_agente', v)} options={opciones.agentes} placeholder="Todos los comerciales" />
      <SearchSelect label="Inmobiliaria" value={filtros.inmobiliaria} onChange={v => set('inmobiliaria', v)} options={opciones.inmobiliarias} placeholder="Todas las inmobiliarias" />
      <SearchSelect label="Estado contrato" value={filtros.estado} onChange={v => set('estado', v)} options={opciones.estados} placeholder="Todos los estados" />
      <SearchSelect label="Categoría" value={filtros.categoria} onChange={v => set('categoria', v)} options={opciones.categorias} placeholder="Todas las categorías" />

      <RangoAlquiler
        value={filtros.rangoAlquiler}
        onChange={v => onChange({ ...filtros, rangoAlquiler: v || undefined })}
      />

      <div style={{ marginTop:'14px' }}>
        <label style={style.label}>Fecha de cierre desde</label>
        <input type="date" style={style.sel} value={filtros.fechaDesde ?? ''} onChange={e => set('fechaDesde', e.target.value)} />
        <label style={style.label}>Fecha de cierre hasta</label>
        <input type="date" style={style.sel} value={filtros.fechaHasta ?? ''} onChange={e => set('fechaHasta', e.target.value)} />
      </div>

      <div style={style.section}>
        <div style={style.sectionTitle}>Filtrar por actividad</div>
        <label style={style.checkRow}>
          <input type="checkbox" checked={!!filtros.conRenovaciones} onChange={e => set('conRenovaciones', e.target.checked ? 'true' : '')} />
          <span style={{ fontSize:'12px', color:'#333' }}>🔄 Con renovaciones</span>
        </label>
        <label style={style.checkRow}>
          <input type="checkbox" checked={!!filtros.conRecuperos} onChange={e => set('conRecuperos', e.target.checked ? 'true' : '')} />
          <span style={{ fontSize:'12px', color:'#333' }}>⚠️ Con impagos recupero</span>
        </label>
        <label style={style.checkRow}>
          <input type="checkbox" checked={!!filtros.conNotificaciones} onChange={e => set('conNotificaciones', e.target.checked ? 'true' : '')} />
          <span style={{ fontSize:'12px', color:'#333' }}>📋 Con notificaciones impago</span>
        </label>
        <label style={style.checkRow}>
          <input type="checkbox" checked={!!filtros.conLegales} onChange={e => set('conLegales', e.target.checked ? 'true' : '')} />
          <span style={{ fontSize:'12px', color:'#333' }}>⚖️ Con impagos legales</span>
        </label>
      </div>

      <button style={style.btn} onClick={() => onChange({})}>Limpiar filtros</button>
    </div>
  );
}
