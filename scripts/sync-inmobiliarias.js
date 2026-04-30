import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const ZOHO_CLIENT_ID       = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET   = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN   = process.env.ZOHO_REFRESH_TOKEN;
const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_MAPS_KEY      = process.env.GOOGLE_MAPS_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const COQL_FIELDS = [
  'id', 'Account_Name', 'Raz_n_Social', 'NIF_CIF', 'Email', 'Email_Secundario',
  'Phone', 'Movil', 'Website', 'Comercial_GarantiaYa', 'Analytics_Agente',
  'Correo_Comercial', 'id_comercial', 'Comision', 'Comision_Renovacion',
  'Comision_Forma_de_Pago', 'Billing_Street', 'Billing_City', 'Billing_State',
  'Billing_Code', 'Billing_Country', 'Renta_Activa', 'Marca',
  'Acuerdo_de_Colaboracion_Firmado', 'Migrado', 'Modified_Time',
].join(', ');

async function getAccessToken() {
  const res = await fetch('https://accounts.zoho.eu/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id:     ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type:    'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  console.log('✅ Token de Zoho obtenido');
  return data.access_token;
}

async function getLastSyncDate() {
  const { data } = await supabase
    .from('inmobiliarias')
    .select('synced_at')
    .order('synced_at', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const lastSync = new Date(data[0].synced_at);
    lastSync.setHours(lastSync.getHours() - 1);
    return lastSync.toISOString().replace('T', ' ').substring(0, 19);
  }
  return '2020-01-01 00:00:00';
}

async function fetchModifiedInmobiliarias(token, since) {
  const results = {};
  let offset    = 0;
  let hasMore   = true;
  const LIMIT   = 200;

  console.log(`📅 Trayendo inmobiliarias modificadas desde: ${since}`);

  while (hasMore) {
    const query = `select ${COQL_FIELDS} from Accounts where Modified_Time >= '${since}' limit ${LIMIT} offset ${offset}`;
    try {
      const res  = await fetch('https://www.zohoapis.eu/crm/v7/coql', {
        method: 'POST',
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ select_query: query }),
      });
      const data = await res.json();

      if (data.code && data.code !== 'SUCCESS') {
        console.error(`\n❌ Error COQL:`, data.code, data.message);
        break;
      }

      if (!data.data || data.data.length === 0) break;
      data.data.forEach(d => { results[d.id] = d; });
      hasMore = data.info?.more_records ?? false;
      offset += LIMIT;
    } catch (e) {
      console.error(`\n❌ Error offset ${offset}:`, e.message);
      break;
    }
    process.stdout.write(`\r📦 ${Object.keys(results).length} inmobiliarias modificadas...`);
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n✅ ${Object.keys(results).length} inmobiliarias modificadas desde ${since}`);
  return Object.values(results);
}

async function getDealsStats() {
  let all  = [];
  let page = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data } = await supabase
      .from('fianzas')
      .select('inmobiliaria_zoho_id, amount, stage')
      .not('inmobiliaria_zoho_id', 'is', null)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  const stats = {};
  all.forEach(d => {
    const id = d.inmobiliaria_zoho_id;
    if (!id) return;
    if (!stats[id]) stats[id] = { total_deals: 0, total_polizas: 0, total_amount: 0 };
    stats[id].total_deals++;
    if (d.stage === 'Póliza Vendida') {
      stats[id].total_polizas++;
      stats[id].total_amount += d.amount ?? 0;
    }
  });

  return stats;
}

function buildAddress(d) {
  const street = d.Billing_Street?.trim();
  const city   = d.Billing_City?.trim();
  const state  = d.Billing_State?.trim();

  if (street && street.length > 5) return street;
  if (city || state) return [city, state].filter(Boolean).join(', ');
  return null;
}

async function geocode(address) {
  if (!address || !GOOGLE_MAPS_KEY) return { lat: null, lng: null };
  try {
    const res  = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ', España')}&key=${GOOGLE_MAPS_KEY}`
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

function mapInmobiliaria(d, stats) {
  const s = stats[d.id] ?? { total_deals: 0, total_polizas: 0, total_amount: 0 };
  return {
    zoho_id:              d.id,
    account_name:         d.Account_Name,
    razon_social:         d.Raz_n_Social ?? null,
    nif_cif:              d.NIF_CIF ?? null,
    email:                d.Email ?? null,
    email_secundario:     d.Email_Secundario ?? null,
    telefono:             d.Phone ?? null,
    movil:                d.Movil ?? null,
    website:              d.Website ?? null,
    comercial_garantiaya: d.Comercial_GarantiaYa ?? null,
    analytics_agente:     d.Analytics_Agente ?? null,
    correo_comercial:     d.Correo_Comercial ?? null,
    id_comercial:         d.id_comercial ?? null,
    comision:             String(d.Comision ?? ''),
    comision_renovacion:  String(d.Comision_Renovacion ?? ''),
    comision_forma_pago:  d.Comision_Forma_de_Pago ?? null,
    billing_street:       d.Billing_Street ?? null,
    billing_city:         d.Billing_City ?? null,
    billing_state:        d.Billing_State ?? null,
    billing_code:         d.Billing_Code ?? null,
    billing_country:      d.Billing_Country ?? null,
    renta_activa:         d.Renta_Activa ?? false,
    marca:                d.Marca ?? false,
    acuerdo_colaboracion: d.Acuerdo_de_Colaboracion_Firmado ?? false,
    migrado:              d.Migrado ?? false,
    total_deals:          s.total_deals,
    total_polizas:        s.total_polizas,
    total_amount:         s.total_amount,
    zoho_modified_time:   d.Modified_Time ?? null,
    synced_at:            new Date().toISOString(),
  };
}

async function upsertBatch(rows) {
  const { error } = await supabase
    .from('inmobiliarias')
    .upsert(rows, { onConflict: 'zoho_id' });
  if (error) throw new Error(`Supabase upsert error: ${error.message}`);
}

async function main() {
  console.log('🚀 Iniciando sync incremental Inmobiliarias → Supabase');
  const token = await getAccessToken();

  const since         = await getLastSyncDate();
  const inmobiliarias = await fetchModifiedInmobiliarias(token, since);

  if (inmobiliarias.length === 0) {
    console.log('✅ No hay inmobiliarias modificadas desde el último sync');
    // Aun así recalcular stats porque pueden haber cambiado deals
    console.log('📊 Recalculando stats de deals...');
    const stats = await getDealsStats();
    const { data: todas } = await supabase
      .from('inmobiliarias')
      .select('zoho_id');

    const rows = (todas ?? []).map(i => ({
      zoho_id:      i.zoho_id,
      total_deals:  stats[i.zoho_id]?.total_deals  ?? 0,
      total_polizas: stats[i.zoho_id]?.total_polizas ?? 0,
      total_amount:  stats[i.zoho_id]?.total_amount  ?? 0,
      synced_at:    new Date().toISOString(),
    }));

    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      await upsertBatch(rows.slice(i, i + BATCH));
    }
    console.log(`✅ Stats actualizadas para ${rows.length} inmobiliarias`);
    return;
  }

  console.log('📊 Calculando stats de deals...');
  const stats = await getDealsStats();

  // Traer las ya geocodificadas
  const zohoIds = inmobiliarias.map(d => d.id);
  const { data: yaGeocoded } = await supabase
    .from('inmobiliarias')
    .select('zoho_id, lat, billing_street')
    .in('zoho_id', zohoIds)
    .not('lat', 'is', null);

  const geocodedMap = {};
  (yaGeocoded ?? []).forEach(r => { geocodedMap[r.zoho_id] = r; });

  let geocodedCount = 0;
  const rows        = [];

  for (const inmo of inmobiliarias) {
    const row      = mapInmobiliaria(inmo, stats);
    const address  = buildAddress(inmo);
    const existing = geocodedMap[inmo.id];

    const dirCambio       = existing && address &&
                            existing.billing_street?.trim() !== inmo.Billing_Street?.trim();
    const necesitaGeocode = address && (!existing?.lat || dirCambio);

    if (necesitaGeocode) {
      const { lat, lng } = await geocode(address);
      row.lat                     = lat;
      row.lng                     = lng;
      row.geocodificado           = lat !== null;
      row.calidad_geocodificacion = lat ? 'completa' : 'sin_coordenadas';
      if (lat) geocodedCount++;
    } else if (existing?.lat) {
      row.lat                     = existing.lat;
      row.geocodificado           = true;
      row.calidad_geocodificacion = 'completa';
    } else {
      row.calidad_geocodificacion = address ? 'sin_coordenadas' : 'sin_direccion';
    }

    rows.push(row);
  }

  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    await upsertBatch(rows.slice(i, i + BATCH));
  }

  console.log(`✅ ${rows.length} inmobiliarias actualizadas, ${geocodedCount} geocodificaciones`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
