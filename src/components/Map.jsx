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

function buildPopup(f) {
  const isVigente        = f.estado_contrato === 'VIGENTE';
  const estadoBadgeBg    = isVigente ? '#dcfce7' : '#fef3c7';
  const estadoBadgeColor = isVigente ? '#166534' : '#92400e';

  const renovaciones      = f.renovaciones ?? [];
  const recuperos         = f.impagos_recupero ?? [];
  const notificaciones    = f.impagos_notificaciones ?? [];
  const legales           = f.impagos_legales ?? [];

  const tieneImpagos = recuperos.length > 0 || notificaciones.length > 0 || legales.length > 0;

  // Sección renovaciones
  let secRenovaciones = '';
  if (renovaciones.length > 0) {
    const rows = renovaciones.map(r => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f5f5f5;">
        <div>
          <div style="font-size:11px;color:#222;font-weight:500;">${esc(r.name)}</div>
          <div style="font-size:10px;color:#999;">${esc(r.stage)} · Nº${esc(r.renovacion_n)}</div>
        </div>
        <span style="font-size:11px;color:#1a1a2e;font-weight:600;">${fmt(r.amount)}</span>
      </div>
    `).join('');
    secRenovaciones = `
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #f0f0f0;">
        <div style="font-size:10px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px;">
          🔄 Renovaciones (${renovaciones.length})
        </div>
        ${rows}
      </div>
    `;
  }

  // Sección impagos
  let secImpagos = '';
  if (tieneImpagos) {
    let impagosHtml = '';

    if (recuperos.length > 0) {
      impagosHtml += recuperos.map(r => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f5f5f5;">
          <div>
            <div style="font-size:11px;color:#222;font-weight:500;">${esc(r.name)}</div>
            <div style="font-size:10px;color:#999;">Recupero · ${esc(r.fase)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;color:#ef4444;font-weight:600;">Pendiente: ${fmt(r.saldo_pendiente)}</div>
            <div style="font-size:10px;color:#10b981;">Pagado: ${fmt(r.total_pagado)}</div>
          </div>
        </div>
      `).join('');
    }

    if (notificaciones.length > 0) {
      impagosHtml += notificaciones.map(n => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f5f5f5;">
          <div>
            <div style="font-size:11px;color:#222;font-weight:500;">${esc(n.name)}</div>
            <div style="font-size:10px;color:#999;">Notificación · ${esc(n.periodo_mes)} ${esc(n.periodo_ano)}</div>
          </div>
          <span style="font-size:11px;color:#f59e0b;font-weight:600;">${fmt(n.importe)}</span>
        </div>
      `).join('');
    }

    if (legales.length > 0) {
      impagosHtml += legales.map(l => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f5f5f5;">
          <div>
            <div style="font-size:11px;color:#222;font-weight:500;">${esc(l.name)}</div>
            <div style="font-size:10px;color:#ef4444;">Legal · ${esc(l.fase_legal)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;color:#ef4444;font-weight:600;">Pendiente: ${fmt(l.saldo_pendiente)}</div>
            <div style="font-size:10px;color:#10b981;">Recuperado: ${fmt(l.saldo_recuperado)}</div>
          </div>
        </div>
      `).join('');
    }

    secImpagos = `
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #f0f0f0;">
        <div style="font-size:10px;color:#ef4444;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px;">
          ⚠️ Impagos (${recuperos.length + notificaciones.length + legales.length})
        </div>
        ${impagosHtml}
      </div>
    `;
  }

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:300px;">
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
      </div>
      ${secRenovaciones}
      ${secImpagos}
    </div>
  `;
}

export default function Map({ fianzas, stats, filtersOpen }) {
  const mapRef      = useRef(null);
  const mapObj      = useRef(null);
  const layerRef    = useRef(null);
  const zoomRef     = useRef(null);
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
      const isVigente = f.estado_contrato === 'VIGENTE';
      const color     = isVigente ? '#10b981' : '#f59e0b';
      const size      = 14;

      const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([parseFloat(f.lat), parseFloat(f.lng)], { icon });
      marker.bindPopup(buildPopup(f), { maxWidth: 320 });
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
            <div style={{ fontWeight:600, fontSize:'11px', color:'#999', textTransform:'uppercase', letterSpacing:'0.5px' }}>Estado</div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ width:12, height:12, borderRadius:'50%', background:'#10b981', display:'inline-block', border:'2px solid white', boxShadow:'0 0 0 1px #10b981' }}/>
              <span style={{ fontSize:'12px', color:'#333' }}>Vigente</span>
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
