import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

const esc = (str) => (str ?? '—')
  .replace(/&/g, '&amp;')
  .replace(/'/g, '&#39;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const fmt = (n) => n ? `€${Number(n).toLocaleString('es-ES')}` : '—';

const fmtDate = (d) => {
  if (!d) return null;
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const faseColor = (fase) => {
  if (!fase) return '#999';
  const f = fase.toLowerCase();
  if (f.includes('pagado') || f.includes('cerrado') || f.includes('recuperado')) return '#10b981';
  if (f.includes('legal') || f.includes('demanda') || f.includes('juicio')) return '#ef4444';
  if (f.includes('nuevo') || f.includes('pendiente') || f.includes('notif')) return '#f59e0b';
  return '#6366f1';
};

function buildPopup(f) {
  const isVigente        = f.estado_contrato === 'VIGENTE';
  const estadoBadgeBg    = isVigente ? '#dcfce7' : '#fef3c7';
  const estadoBadgeColor = isVigente ? '#166534' : '#92400e';

  const renovaciones   = f.renovaciones ?? [];
  const recuperos      = f.impagos_recupero ?? [];
  const notificaciones = f.impagos_notificaciones ?? [];
  const legales        = f.impagos_legales ?? [];

  let secRenovaciones = '';
  if (renovaciones.length > 0) {
    const rows = renovaciones.map(r => `
      <div style="background:#f9f9f9;border-radius:6px;padding:8px 10px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:11px;color:#1a1a2e;font-weight:600;">${esc(r.name)}</span>
          <span style="font-size:11px;color:#10b981;font-weight:700;">${fmt(r.amount)}</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <span style="font-size:10px;background:#e0e7ff;color:#3730a3;padding:1px 6px;border-radius:10px;font-weight:500;">Nº ${esc(r.renovacion_n) === '—' ? '1' : esc(r.renovacion_n)}</span>
          <span style="font-size:10px;background:#f0fdf4;color:#166534;padding:1px 6px;border-radius:10px;font-weight:500;">Fase: ${esc(r.stage)}</span>
          ${r.estado_contrato ? `<span style="font-size:10px;background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:10px;font-weight:500;">${esc(r.estado_contrato)}</span>` : ''}
          ${r.closing_date ? `<span style="font-size:10px;color:#999;">Cierre: ${fmtDate(r.closing_date)}</span>` : ''}
        </div>
      </div>
    `).join('');
    secRenovaciones = `
      <div style="margin-top:10px;padding-top:10px;border-top:2px solid #e0e7ff;">
        <div style="font-size:11px;color:#3730a3;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px;">
          🔄 Renovaciones — ${renovaciones.length} registro${renovaciones.length > 1 ? 's' : ''}
        </div>
        ${rows}
      </div>
    `;
  }

  let secRecuperos = '';
  if (recuperos.length > 0) {
    const rows = recuperos.map(r => `
      <div style="background:#fff8f8;border-radius:6px;padding:8px 10px;margin-bottom:6px;border-left:3px solid #ef4444;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:11px;color:#1a1a2e;font-weight:600;">${esc(r.name)}</span>
          <span style="font-size:10px;background:${faseColor(r.fase)}22;color:${faseColor(r.fase)};padding:1px 6px;border-radius:10px;font-weight:600;">${esc(r.fase)}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:4px;">
          <div style="font-size:10px;">
            <span style="color:#999;">Total reclamado</span><br/>
            <span style="font-weight:600;color:#ef4444;">${fmt(r.total_reclamos)}</span>
          </div>
          <div style="font-size:10px;">
            <span style="color:#999;">Saldo pendiente</span><br/>
            <span style="font-weight:600;color:#f59e0b;">${fmt(r.saldo_pendiente)}</span>
          </div>
          <div style="font-size:10px;">
            <span style="color:#999;">Total pagado</span><br/>
            <span style="font-weight:600;color:#10b981;">${fmt(r.total_pagado)}</span>
          </div>
        </div>
      </div>
    `).join('');
    secRecuperos = `
      <div style="margin-top:10px;padding-top:10px;border-top:2px solid #fee2e2;">
        <div style="font-size:11px;color:#ef4444;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px;">
          ⚠️ Impagos Recupero — ${recuperos.length} caso${recuperos.length > 1 ? 's' : ''}
        </div>
        ${rows}
      </div>
    `;
  }

  let secNotificaciones = '';
  if (notificaciones.length > 0) {
    const rows = notificaciones.map(n => `
      <div style="background:#fffbf0;border-radius:6px;padding:8px 10px;margin-bottom:6px;border-left:3px solid #f59e0b;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:11px;color:#1a1a2e;font-weight:600;">${esc(n.name)}</span>
          <span style="font-size:11px;color:#f59e0b;font-weight:700;">${fmt(n.importe)}</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
          <span style="font-size:10px;background:${faseColor(n.fase)}22;color:${faseColor(n.fase)};padding:1px 6px;border-radius:10px;font-weight:600;">Fase: ${esc(n.fase)}</span>
          ${n.periodo_mes ? `<span style="font-size:10px;color:#666;background:#f5f5f5;padding:1px 6px;border-radius:10px;">Período: ${esc(n.periodo_mes)} ${esc(n.periodo_ano)}</span>` : ''}
        </div>
      </div>
    `).join('');
    secNotificaciones = `
      <div style="margin-top:10px;padding-top:10px;border-top:2px solid #fef3c7;">
        <div style="font-size:11px;color:#d97706;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px;">
          📋 Notificaciones Impago — ${notificaciones.length} registro${notificaciones.length > 1 ? 's' : ''}
        </div>
        ${rows}
      </div>
    `;
  }

  let secLegales = '';
  if (legales.length > 0) {
    const rows = legales.map(l => `
      <div style="background:#fff0f0;border-radius:6px;padding:8px 10px;margin-bottom:6px;border-left:3px solid #dc2626;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:11px;color:#1a1a2e;font-weight:600;">${esc(l.name)}</span>
          <span style="font-size:10px;background:${l.caso_activo ? '#fee2e2' : '#f0fdf4'};color:${l.caso_activo ? '#dc2626' : '#16a34a'};padding:1px 6px;border-radius:10px;font-weight:600;">
            ${l.caso_activo ? '🔴 Activo' : '✅ Cerrado'}
          </span>
        </div>
        <div style="font-size:10px;margin-bottom:4px;">
          <span style="background:#fee2e2;color:#dc2626;padding:1px 6px;border-radius:10px;font-weight:500;">Fase: ${esc(l.fase_legal)}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:4px;">
          <div style="font-size:10px;">
            <span style="color:#999;">Saldo pendiente</span><br/>
            <span style="font-weight:600;color:#ef4444;">${fmt(l.saldo_pendiente)}</span>
          </div>
          <div style="font-size:10px;">
            <span style="color:#999;">Saldo recuperado</span><br/>
            <span style="font-weight:600;color:#10b981;">${fmt(l.saldo_recuperado)}</span>
          </div>
        </div>
      </div>
    `).join('');
    secLegales = `
      <div style="margin-top:10px;padding-top:10px;border-top:2px solid #fecaca;">
        <div style="font-size:11px;color:#dc2626;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px;">
          ⚖️ Impagos Legales — ${legales.length} caso${legales.length > 1 ? 's' : ''}
        </div>
        ${rows}
      </div>
    `;
  }

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:300px;padding:14px 16px;">
      <div style="background:#1a1a2e;padding:12px 14px;margin:-14px -20px 12px;display:flex;align-items:center;justify-content:space-between;border-radius:4px 4px 0 0;">
        <span style="color:white;font-size:14px;font-weight:700;">${esc(f.deal_name)}</span>
        <span style="background:${estadoBadgeBg};color:${estadoBadgeColor};font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px;text-transform:uppercase;">${esc(f.estado_contrato)}</span>
      </div>
      <div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #f0f0f0;">
        <span>📍</span>
        <span style="font-size:11px;color:#555;line-height:1.5;">${esc(f.direccion_completa ?? f.ciudad)}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;">Inmobiliaria</span>
          <span style="font-size:11px;color:#222;font-weight:500;max-width:160px;text-align:right;">${esc(f.nombre_inmobiliaria)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;">Comercial</span>
          <span style="font-size:11px;color:#222;font-weight:500;">${esc(f.analytics_agente ?? f.comercial_garantiaya)}</span>
        </div>
        <div style="height:1px;background:#f0f0f0;"></div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;">Precio garantía</span>
          <span style="font-size:12px;color:#1a1a2e;font-weight:700;">${fmt(f.amount)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;">Alquiler</span>
          <span style="font-size:12px;color:#1a1a2e;font-weight:700;">${fmt(f.alquiler)}<span style="font-size:10px;font-weight:400;color:#999">/mes</span></span>
        </div>
        <div style="height:1px;background:#f0f0f0;"></div>
        ${fmtDate(f.closing_date) ? `
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;">Fecha de cierre</span>
          <span style="font-size:11px;color:#222;font-weight:500;">${fmtDate(f.closing_date)}</span>
        </div>
        ` : ''}
        ${f.duracion_contrato_meses ? `
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;">Duración contrato</span>
          <span style="font-size:11px;color:#222;font-weight:500;">${esc(f.duracion_contrato_meses)} meses</span>
        </div>
        ` : ''}
      </div>
      ${secRenovaciones}
      ${secRecuperos}
      ${secNotificaciones}
      ${secLegales}
    </div>
  `;
}

export default function Map({ fianzas, stats, filtersOpen }) {
  const mapRef   = useRef(null);
  const mapObj   = useRef(null);
  const layerRef = useRef(null);
  const zoomRef  = useRef(null);
  const [showPanel, setShowPanel] = useState(true);

  useEffect(() => {
    if (mapObj.current) return;
    mapObj.current = L.map(mapRef.current, {
      center: [40.4168, -3.7038],
      zoom: 6,
      zoomControl: false,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CartoDB',
      maxZoom: 19,
    }).addTo(mapObj.current);
    zoomRef.current = L.control.zoom({ position: 'topright' });
    zoomRef.current.addTo(mapObj.current);
  }, []);

  useEffect(() => {
    if (!mapObj.current || !zoomRef.current) return;
    zoomRef.current.remove();
    zoomRef.current = L.control.zoom({ position: 'topright' });
    zoomRef.current.addTo(mapObj.current);
  }, [filtersOpen]);

  useEffect(() => {
    if (!mapObj.current || !fianzas.length) return;
    if (layerRef.current) mapObj.current.removeLayer(layerRef.current);

    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 50,
      chunkDelay: 50,
      maxClusterRadius: 50,
      iconCreateFunction: (c) => {
        const count = c.getChildCount();
        const size  = count > 100 ? 44 : count > 50 ? 38 : count > 10 ? 32 : 28;
        return L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;background:#1a1a2e;color:white;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${count > 999 ? '+999' : count}</div>`,
          className: '',
          iconSize: [size, size],
        });
      },
    });

    fianzas.forEach(f => {
      if (!f.lat || !f.lng) return;
      const isVigente    = f.estado_contrato === 'VIGENTE';
      const tieneImpagos = (f.impagos_recupero?.length > 0) ||
                           (f.impagos_notificaciones?.length > 0) ||
                           (f.impagos_legales?.length > 0);
      const color = tieneImpagos ? '#ef4444' : isVigente ? '#10b981' : '#f59e0b';
      const size  = 14;

      const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([parseFloat(f.lat), parseFloat(f.lng)], { icon });
      marker.bindPopup(buildPopup(f), { maxWidth: 320, maxHeight: 400 });
      cluster.addLayer(marker);
    });

    layerRef.current = cluster;
    mapObj.current.addLayer(cluster);
  }, [fianzas]);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <div ref={mapRef} style={{ width:'100%', height:'100%' }} />
      <div style={{
        position:'absolute', bottom:'32px', right:'12px', zIndex:1000,
        background:'white', borderRadius:'12px',
        boxShadow:'0 2px 16px rgba(0,0,0,0.13)',
        minWidth:'210px', overflow:'hidden',
      }}>
        <button
          onClick={() => setShowPanel(!showPanel)}
          style={{ width:'100%', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', cursor:'pointer', borderBottom: showPanel ? '1px solid #f0f0f0' : 'none' }}
        >
          <span style={{ fontSize:'12px', fontWeight:700, color:'#1a1a2e' }}>📊 {(stats?.total ?? 0).toLocaleString('es-ES')} pólizas</span>
          <span style={{ fontSize:'12px', color:'#999' }}>{showPanel ? '▼' : '▲'}</span>
        </button>
        {showPanel && (
          <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px', paddingBottom:'10px', borderBottom:'1px solid #f0f0f0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'11px', color:'#999', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.4px' }}>Total recaudado</span>
                <span style={{ fontSize:'14px', color:'#10b981', fontWeight:700 }}>€{(stats?.totalAmount ?? 0).toLocaleString('es-ES')}</span>
              </div>
            </div>
            <div style={{ fontWeight:600, fontSize:'11px', color:'#999', textTransform:'uppercase', letterSpacing:'0.5px' }}>Estado marker</div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ width:12, height:12, borderRadius:'50%', background:'#10b981', display:'inline-block', border:'2px solid white', boxShadow:'0 0 0 1px #10b981' }}/>
              <span style={{ fontSize:'12px', color:'#333' }}>Vigente sin impagos</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ width:12, height:12, borderRadius:'50%', background:'#ef4444', display:'inline-block', border:'2px solid white', boxShadow:'0 0 0 1px #ef4444' }}/>
              <span style={{ fontSize:'12px', color:'#333' }}>Con impagos</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ width:12, height:12, borderRadius:'50%', background:'#f59e0b', display:'inline-block', border:'2px solid white', boxShadow:'0 0 0 1px #f59e0b' }}/>
              <span style={{ fontSize:'12px', color:'#333' }}>Otro estado</span>
            </div>
            {stats?.sinUbicacion > 0 && (
              <>
                <div style={{ fontWeight:600, fontSize:'11px', color:'#999', textTransform:'uppercase', letterSpacing:'0.5px', paddingTop:'10px', borderTop:'1px solid #f0f0f0' }}>Sin ubicación</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ width:12, height:12, borderRadius:'2px', background:'#ef4444', display:'inline-block', opacity:0.7 }}/>
                    <span style={{ fontSize:'12px', color:'#333' }}>No localizadas</span>
                  </div>
                  <span style={{ fontWeight:700, color:'#ef4444', fontSize:'13px' }}>{stats.sinUbicacion.toLocaleString('es-ES')}</span>
                </div>
                <p style={{ fontSize:'10px', color:'#aaa', margin:0, lineHeight:1.4 }}>Dirección incompleta o no reconocida.</p>
              </>
            )}
            <div style={{ fontWeight:600, fontSize:'11px', color:'#999', textTransform:'uppercase', letterSpacing:'0.5px', paddingTop:'10px', borderTop:'1px solid #f0f0f0' }}>Agrupación</div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ width:22, height:22, borderRadius:'50%', background:'#1a1a2e', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'9px', fontWeight:700, border:'2px solid white', boxShadow:'0 0 0 1px #1a1a2e', flexShrink:0 }}>N</span>
              <span style={{ fontSize:'12px', color:'#333' }}>Haz zoom para expandir</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
