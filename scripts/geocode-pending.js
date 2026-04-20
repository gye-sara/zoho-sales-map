import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;

function esCatastro(str) {
  if (!str) return false;
  const limpio = str.trim().replace(/\s/g, '');
  return /^[0-9]{7}[A-Z]{2}[0-9]{4}[A-Z][0-9]{4}[A-Z]{2}$/.test(limpio) ||
         /^[0-9A-Z]{14,20}$/.test(limpio);
}

function buildAddress(r) {
  const propiedad = r.direccion_completa?.trim();
  const direccion = r.direccion?.trim();

  if (propiedad && !esCatastro(propiedad))
    return { address: `${propiedad}, España`, calidad: 'completa' };

  if (direccion && !esCatastro(direccion)) {
    const parts = [direccion, r.ciudad, r.provincia, r.codigo_postal].filter(Boolean);
    if (parts.length >= 2)
      return { address: `${parts.join(', ')}, España`, calidad: 'parcial' };
  }

  if (r.ciudad || r.provincia)
    return { address: [r.ciudad, r.provincia, 'España'].filter(Boolean).join(', '), calidad: 'ciudad' };

  return { address: null, calidad: 'sin_direccion' };
}

async function geocode(address) {
  if (!address || !GOOGLE_MAPS_KEY) return { lat: null, lng: null };
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`
    );
    const data = await res.json();
    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    return { lat: null, lng: null };
  } catch {
    return { lat: null, lng: null };
  }
}

async function main() {
  console.log('🗺️  Geocodificando registros pendientes...');

  // Traer todos los que no tienen coordenadas en lotes de 1000
  let offset = 0;
  let totalGeocoded = 0;
  let totalFailed = 0;
  const BATCH = 1000;

  while (true) {
    const { data: rows, error } = await supabase
      .from('fianzas')
      .select('zoho_id, direccion_completa, direccion, ciudad, provincia, codigo_postal')
      .is('lat', null)
      .range(offset, offset + BATCH - 1);

    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) break;

    console.log(`📦 Procesando registros ${offset + 1} - ${offset + rows.length}...`);

    for (const row of rows) {
      const { address, calidad } = buildAddress(row);

      if (!address) {
        await supabase.from('fianzas')
          .update({ calidad_geocodificacion: 'sin_direccion' })
          .eq('zoho_id', row.zoho_id);
        totalFailed++;
        continue;
      }

      const { lat, lng } = await geocode(address);

      await supabase.from('fianzas')
        .update({
          lat,
          lng,
          geocodificado:           lat !== null,
          calidad_geocodificacion: calidad,
        })
        .eq('zoho_id', row.zoho_id);

      if (lat) {
        totalGeocoded++;
        if (totalGeocoded % 100 === 0) {
          console.log(`✅ ${totalGeocoded} geocodificados...`);
        }
      } else {
        totalFailed++;
      }
    }

    offset += rows.length;
    if (rows.length < BATCH) break;
  }

  console.log(`\n✅ Geocodificación completada`);
  console.log(`   Geocodificados: ${totalGeocoded}`);
  console.log(`   Sin coordenadas: ${totalFailed}`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
