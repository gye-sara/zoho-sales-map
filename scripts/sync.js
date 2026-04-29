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

const FIELDS_BATCH_1 = [
  'id','Deal_Name','Id_Garantia','Id_Garantia_auto','Categoria_de_Garantia',
  'num_fant','Contact_Name','Arrendatario_Principal','Arrendador',
  'Account_Name','Agente_Inmobiliario','Comercial_GarantiaYa',
  'Correo_Comercial','Analytics_Agente','Sucursal','Gestor_Riesgo','Owner',
  'Stage','Estado_del_Contrato','Renta_Activa','Resolucion_Riesgo',
  'Cotizacion','Documentacion','Comision','Tipo_de_Firma','Contratante',
  'Amount','Precio_Final','Alquiler','Alquiler_Total','Monto_Aprobado',
  'Inicio_Renta_Garantizada','Tipo_de_Alquiler','Dia_Vencimiento_de_Renta',
  'Tipo_de_Duracion','Duracion_de_Contrato_Meses',
  'Closing_Date','Fecha_Firma_Contrato_de_Arrendamiento',
  'Fecha_de_Inicio_de_Contrato_de_Arrendamiento','Fecha_Inicio_de_Garantia',
  'Fecha_Proxima_Renovacion','Fecha_Finalizacion_de_Garantia',
  'Fecha_Fase','Fecha_de_Aprobacion','Modified_Time',
].join(',');

const FIELDS_BATCH_2 = [
  'id','Direccion','Ciudad','Provincia','Codigo_Postal','Planta','Puerta',
  'Direccion_Propiedad','id_factura','num_factura','status_factura',
  'Pago','Forma_de_Pago',
].join(',');

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

function generateRanges(fromDate, toDate) {
  const ranges = [];
  let current = new Date(fromDate);
  const end = new Date(toDate);
  while (current < end) {
    const rangeStart = current.toISOString().split('T')[0];
    const next = new Date(current);
    next.setMonth(next.getMonth() + 1);
    const rangeEnd = next > end
      ? end.toISOString().split('T')[0]
      : next.toISOString().split('T')[0];
    ranges.push({ from: rangeStart, to: rangeEnd });
    current = next;
  }
  return ranges;
}

function generateWeekRanges(fromDate, toDate) {
  const ranges = [];
  let current = new Date(fromDate);
  const end = new Date(toDate);
  while (current < end) {
    const rangeStart = current.toISOString().split('T')[0];
    const next = new Date(current);
    next.setDate(next.getDate() + 7);
    const rangeEnd = next > end
      ? end.toISOString().split('T')[0]
      : next.toISOString().split('T')[0];
    ranges.push({ from: rangeStart, to: rangeEnd });
    current = next;
  }
  return ranges;
}

async function fetchRange(token, fields, dateFrom, dateTo) {
  const criteria = encodeURIComponent(
    `(Closing_Date:between:${dateFrom},${dateTo})`
  );
  let results = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://www.zohoapis.eu/crm/v7/Deals/search?criteria=${criteria}&fields=${fields}&per_page=200&page=${page}`;
    let data;
    try {
      const res = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
      const text = await res.text();
      if (!text || text.trim() === '') break;
      data = JSON.parse(text);
    } catch { break; }

    if (!data || data.status === 'error') {
      if (data?.code === 'LIMIT_REACHED') return { results, limitReached: true };
      if (data?.code === 'NO_DATA') break;
      break;
    }
    if (!data.data || data.data.length === 0) break;

    results = results.concat(data.data);
    hasMore = data.info?.more_records ?? false;
    page++;
  }
  return { results, limitReached: false };
}

async function fetchRangeSafe(token, fields, dateFrom, dateTo, level = 0) {
  const { results, limitReached } = await fetchRange(token, fields, dateFrom, dateTo);
  if (!limitReached) return results;
  if (level >= 2) {
    console.warn(`⚠️  ${dateFrom}→${dateTo} >2000 en rango mínimo`);
    return results;
  }
  const subRanges = generateWeekRanges(dateFrom, dateTo);
  let allResults = [];
  for (const sub of subRanges) {
    const subResults = await fetchRangeSafe(token, fields, sub.from, sub.to, level + 1);
    allResults = allResults.concat(subResults);
  }
  return allResults;
}

function esCatastro(str) {
  if (!str) return false;
  const limpio = str.trim().replace(/\s/g, '');
  return /^[0-9]{7}[A-Z]{2}[0-9]{4}[A-Z][0-9]{4}[A-Z]{2}$/.test(limpio) ||
         /^[0-9A-Z]{14,20}$/.test(limpio);
}

function buildAddress(d) {
  const propiedad = d.Direccion_Propiedad?.trim();
  const direccion = d.Direccion?.trim();

  if (propiedad && !esCatastro(propiedad))
    return { address: `${propiedad}, España`, calidad: 'completa' };

  if (direccion && !esCatastro(direccion)) {
    const parts = [direccion, d.Ciudad, d.Provincia, d.Codigo_Postal].filter(Boolean);
    if (parts.length >= 2)
      return { address: `${parts.join(', ')}, España`, calidad: 'parcial' };
  }

  if (d.Ciudad || d.Provincia)
    return { address: [d.Ciudad, d.Provincia, 'España'].filter(Boolean).join(', '), calidad: 'ciudad' };

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

function mapDeal(d) {
  return {
    zoho_id:                             d.id,
    deal_name:                           d.Deal_Name,
    id_garantia:                         d.Id_Garantia,
    id_garantia_auto:                    d.Id_Garantia_auto,
    categoria_garantia:                  d.Categoria_de_Garantia,
    num_fant:                            d.num_fant,
    nombre_contacto:                     d.Contact_Name?.name ?? null,
    arrendatario_principal:              d.Arrendatario_Principal?.name ?? null,
    arrendador:                          d.Arrendador?.name ?? null,
    nombre_inmobiliaria:                 d.Account_Name?.name ?? null,
    inmobiliaria_zoho_id:                d.Account_Name?.id ?? null,  // ← FK a inmobiliarias
    agente_inmobiliario:                 d.Agente_Inmobiliario?.name ?? null,
    comercial_garantiaya:                d.Comercial_GarantiaYa,
    correo_comercial:                    d.Correo_Comercial,
    analytics_agente:                    d.Analytics_Agente,
    sucursal:                            d.Sucursal,
    gestor_riesgo:                       d.Gestor_Riesgo,
    owner:                               d.Owner?.name ?? null,
    stage:                               d.Stage,
    estado_contrato:                     d.Estado_del_Contrato,
    renta_activa:                        d.Renta_Activa ?? false,
    resolucion_riesgo:                   d.Resolucion_Riesgo,
    cotizacion:                          d.Cotizacion,
    documentacion:                       d.Documentacion,
    comision:                            d.Comision,
    tipo_firma:                          d.Tipo_de_Firma,
    contratante:                         d.Contratante,
    amount:                              d.Amount,
    precio_final:                        d.Precio_Final,
    alquiler:                            d.Alquiler,
    alquiler_total:                      d.Alquiler_Total,
    monto_aprobado:                      d.Monto_Aprobado,
    inicio_renta_garantizada:            d.Inicio_Renta_Garantizada ?? null,
    tipo_alquiler:                       d.Tipo_de_Alquiler,
    dia_vencimiento_renta:               d.Dia_Vencimiento_de_Renta,
    tipo_duracion:                       d.Tipo_de_Duracion,
    duracion_contrato_meses:             d.Duracion_de_Contrato_Meses,
    closing_date:                        d.Closing_Date ?? null,
    fecha_firma_contrato_arrendamiento:  d.Fecha_Firma_Contrato_de_Arrendamiento ?? null,
    fecha_inicio_contrato_arrendamiento: d.Fecha_de_Inicio_de_Contrato_de_Arrendamiento ?? null,
    fecha_inicio_garantia:               d.Fecha_Inicio_de_Garantia ?? null,
    fecha_proxima_renovacion:            d.Fecha_Proxima_Renovacion ?? null,
    fecha_finalizacion_garantia:         d.Fecha_Finalizacion_de_Garantia ?? null,
    fecha_fase:                          d.Fecha_Fase ?? null,
    fecha_aprobacion:                    d.Fecha_de_Aprobacion ?? null,
    direccion:                           d.Direccion,
    ciudad:                              d.Ciudad,
    provincia:                           d.Provincia,
    codigo_postal:                       d.Codigo_Postal,
    planta:                              d.Planta,
    puerta:                              d.Puerta,
    direccion_completa:                  d.Direccion_Propiedad,
    id_factura:                          d.id_factura,
    num_factura:                         d.num_factura,
    status_factura:                      d.status_factura,
    pago:                                d.Pago,
    forma_de_pago:                       d.Forma_de_Pago,
    zoho_modified_time:                  d.Modified_Time ?? null,
    synced_at:                           new Date().toISOString(),
  };
}

async function upsertBatch(rows) {
  const { error } = await supabase
    .from('fianzas')
    .upsert(rows, { onConflict: 'zoho_id', ignoreDuplicates: false });
  if (error) throw new Error(`Supabase upsert error: ${error.message}`);
}

async function geocodeNuevos(deals) {
  const zohoIds = deals.map(d => d.id);

  const { data: existentes } = await supabase
    .from('fianzas')
    .select('zoho_id, lat, direccion_completa')
    .in('zoho_id', zohoIds);

  const existMap = {};
  (existentes ?? []).forEach(r => { existMap[r.zoho_id] = r; });

  const pendientes = deals.filter(d => {
    if (d.Stage !== 'Póliza Vendida') return false;
    const actual = existMap[d.id];
    if (!actual) return true;
    if (!actual.lat) return true;
    const dirZoho = d.Direccion_Propiedad?.trim() ?? null;
    const dirSupa = actual.direccion_completa?.trim() ?? null;
    return dirZoho && dirZoho !== dirSupa;
  });

  if (pendientes.length === 0) return 0;
  console.log(`\n🗺️  Geocodificando ${pendientes.length} deals...`);

  let count = 0;
  for (const deal of pendientes) {
    const { address, calidad } = buildAddress(deal);
    if (!address) {
      await supabase.from('fianzas')
        .update({ calidad_geocodificacion: 'sin_direccion' })
        .eq('zoho_id', deal.id);
      continue;
    }
    const { lat, lng } = await geocode(address);
    await supabase.from('fianzas')
      .update({
        lat,
        lng,
        geocodificado:           lat !== null,
        calidad_geocodificacion: calidad,
        direccion_completa:      deal.Direccion_Propiedad ?? null,
      })
      .eq('zoho_id', deal.id);
    if (lat) count++;
  }
  return count;
}

async function main() {
  console.log('🚀 Iniciando sync Zoho → Supabase (todos los stages)');
  const token = await getAccessToken();

  const START_DATE = '2020-01-01';
  const END_DATE   = new Date().toISOString().split('T')[0];
  const ranges     = generateRanges(START_DATE, END_DATE);

  let totalSaved    = 0;
  let totalGeocoded = 0;
  const seenIds     = new Set();

  for (const range of ranges) {
    process.stdout.write(`📅 ${range.from} → ${range.to}: `);

    const [b1, b2] = await Promise.all([
      fetchRangeSafe(token, FIELDS_BATCH_1, range.from, range.to),
      fetchRangeSafe(token, FIELDS_BATCH_2, range.from, range.to),
    ]);

    if (b1.length === 0) { console.log('0 deals'); continue; }

    const extraMap = {};
    b2.forEach(d => { extraMap[d.id] = d; });
    const deals = b1
      .filter(d => !seenIds.has(d.id))
      .map(d => { seenIds.add(d.id); return { ...d, ...(extraMap[d.id] ?? {}) }; });

    const rows = deals.map(mapDeal);
    const BATCH_SIZE = 100;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await upsertBatch(rows.slice(i, i + BATCH_SIZE));
    }
    totalSaved += rows.length;

    const geocodedCount = await geocodeNuevos(deals);
    totalGeocoded += geocodedCount;

    console.log(`${deals.length} deals → 💾 guardados${geocodedCount > 0 ? `, 🗺️ ${geocodedCount} geocodificados` : ''} (total: ${totalSaved})`);
  }

  console.log(`\n✅ Sync completado — ${totalSaved} deals, ${totalGeocoded} nuevas geocodificaciones`);
}

main().catch(err => {
  console.error('❌ Error en sync:', err);
  process.exit(1);
});
