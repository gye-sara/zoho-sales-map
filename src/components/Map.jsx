import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

export default function Map({ fianzas, stats }) {
  const mapRef   = useRef(null);
  const mapObj   = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (mapObj.current) return;
    mapObj.current = L.map(mapRef.current, {
      center: [40.4168, -3.7038],
      zoom: 6,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CartoDB',
      maxZoom: 19,
    }).addTo(mapObj.current);
  }, []);

  useEffect(() => {
    if (!mapObj.current || !fianzas.length) return;

    if (layerRef.current) {
      mapObj.current.removeLayer(layerRef.current);
    }

    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 50,
      chunkDelay: 50,
      maxClusterRadius: 50,
      iconCreateFunction: (c) => {
        const count = c.getChildCount();
        const size  = count > 100 ? 44 : count > 50 ? 38 : count > 10 ? 32 : 28;
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            background:#1a1a2e;color:white;
            border-radius:50%;border:2px solid white;
            display:flex;align-items:center;justify-content:center;
            font-size:11px;font-weight:700;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
          ">${count > 999 ? '+999' : count}</div>`,
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
        html: `<div style="
          width:${size}px;height:${size}px;
          background:${color};
          border-radius:50%;
          border:2px solid white;
          box-shadow:0 1px 4px rgba(0,0,0,0.3);
        "></div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const estadoBadgeColor = isVigente ? '#dcfce7' : '#fef3c7';
      const estadoTextColor  = isVigente ? '#166534' : '#92400e';

      const marker = L.marker([parseFloat(f.lat), parseFloat(f.lng)], { icon });

      marker.bindPopup(`
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:260px;">
          <div style="background:#1a1a2e;padding:12px 14px;margin:-14px -20px 12px;display:flex;align-items:center;justify-content:space-between;border-radius:4px 4px 0 0;">
            <span style="color:white;font-size:14px;font-weight:700;">${f.deal_name ?? '—'}</span>
            <span style="background:${estadoBadgeColor};color:${estadoTextColor};font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px;text-transform:uppercase;">${f.estado_contrato ?? '—'}</span>
          </div>
          <div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #f0f0f0;">
            <span>📍</span>
            <span style="font-size:11px;color:#555;line-height:1.5;">${f.direccion_completa ?? f.ciudad ?? '—'}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;">Inmobiliaria</span>
              <span style="font-size:11px;color:#222;font-weight:500;max-width:150px;text-align:right;">${f.nombre_inmobiliaria ?? '—'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;">Comercial</span>
              <span style="font-size:11px;color:#222;font-weight:500;">${f.analytics_agente ?? f.comercial_garantiaya ?? '—'}</span>
            </div>
            <div style="height:1px;background:#f0f0f0;"></div>
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;">Precio garantía</span>
              <span style="font-size:12px;color:#1a1a2e;font-weight:700;">€${(f.amount ?? 0).toLocaleString('es-ES')}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;">Alquiler</span>
              <span style="font-size:12px;color:#1a1a2e;font-weight:700;">€${(f.alquiler ?? 0).toLocaleString('es-ES')}<span style="font-size:10px;font-weight:400;color:#999">/mes</span></span>
            </div>
          </div>
        </div>
      `, { maxWidth: 280 });

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
        background:'white', padding:'14px 18px', borderRadius:'12px',
        boxShadow:'0 2px 16px rgba(0,0,0,0.13)', fontSize:'12px',
        display:'flex', flexDirection:'column', gap:'10px',
        minWidth:'210px',
      }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'6px', paddingBottom:'10px', borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'11px', color:'#999', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.4px' }}>Total pólizas</span>
            <span style={{ fontSize:'15px', color:'#1a1a2e', fontWeight:700 }}>{(stats?.total ?? 0).toLocaleString('es-ES')}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'11px', color:'#999', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.4px' }}>Total recaudado</span>
            <span style={{ fontSize:'15px', color:'#10b981', fontWeight:700 }}>€{(stats?.totalAmount ?? 0).toLocaleString('es-ES')}</span>
          </div>
        </div>

        <div style={{ fontWeight:600, fontSize:'11px', color:'#999', textTransform:'uppercase', letterSpacing:'0.5px' }}>Estado</div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ width:12, height:12, borderRadius:'50%', background:'#10b981', display:'inline-block', border:'2px solid white', boxShadow:'0 0 0 1px #10b981' }}/>
          <span style={{ color:'#333' }}>Vigente</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ width:12, height:12, borderRadius:'50%', background:'#f59e0b', display:'inline-block', border:'2px solid white', boxShadow:'0 0 0 1px #f59e0b' }}/>
          <span style={{ color:'#333' }}>Otro estado</span>
        </div>

        {stats?.sinUbicacion > 0 && (
          <>
            <div style={{ fontWeight:600, fontSize:'11px', color:'#999', textTransform:'uppercase', letterSpacing:'0.5px', paddingTop:'10px', borderTop:'1px solid #f0f0f0' }}>Sin ubicación</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:12, height:12, borderRadius:'2px', background:'#ef4444', display:'inline-block', opacity:0.7 }}/>
                <span style={{ color:'#333' }}>No localizadas</span>
              </div>
              <span style={{ fontWeight:700, color:'#ef4444', fontSize:'13px' }}>{stats.sinUbicacion.toLocaleString('es-ES')}</span>
            </div>
            <p style={{ fontSize:'10px', color:'#aaa', margin:0, lineHeight:1.4 }}>
              Dirección incompleta o no reconocida.
            </p>
          </>
        )}

        <div style={{ fontWeight:600, fontSize:'11px', color:'#999', textTransform:'uppercase', letterSpacing:'0.5px', paddingTop:'10px', borderTop:'1px solid #f0f0f0' }}>Agrupación</div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{
            width:22, height:22, borderRadius:'50%',
            background:'#1a1a2e', display:'inline-flex',
            alignItems:'center', justifyContent:'center',
            color:'white', fontSize:'9px', fontWeight:700,
            border:'2px solid white', boxShadow:'0 0 0 1px #1a1a2e'
          }}>N</span>
          <span style={{ color:'#333' }}>Haz zoom para expandir</span>
        </div>
      </div>
    </div>
  );
}
