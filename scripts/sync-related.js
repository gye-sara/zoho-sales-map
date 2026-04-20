import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const ZOHO_CLIENT_ID       = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET   = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN   = process.env.ZOHO_REFRESH_TOKEN;
const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

async function getFianzasIds() {
  let allIds = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('fianzas')
      .select('zoho_id')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allIds = allIds.concat(data);
    if (data.length < PAGE_SIZE) break;
    page++;
  }
  console.log(`📋 ${allIds.length} fianzas en Supabase`);
  return allIds;
}

async function fetchByFianzaId(token, module, fianzaZohoId, fields) {
  const criteria = encodeURIComponent(`(id_ticket_fianzas:equals:${fianzaZohoId})`);
  const url = `https://www.zohoapis.eu/crm/v7/${module}/search?criteria=${criteria}&fields=${fields}&per_page=200`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
    const text = await res.text();
    if (!text || text.trim() === '') return [];
    const data = JSON.parse(text);
    if (data.status === 'error' || !data.data) return [];
    return data.data;
  } catch { return []; }
}

async function fetchLegalesByFianzaId(token, fianzaZohoId, fields) {
  const criteria = encodeURIComponent(`(Fianzas:equals:${fianzaZohoId})`);
  const url = `https://www.zohoapis.eu/crm/v7/Impagos_Legales/search?criteria=${criteria}&fields=${fields}&per_page=200`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
    const text = await res.text();
    if (!text || text.trim() === '') return [];
    const data = JSON.parse(text);
    if (data.status === 'error' || !data.data) return [];
    return data.data;
  } catch { return []; }
}

function mapRenovacion(d, fianzaZohoId) {
  return {
    zoho_id:                             d.id,
    fianza_zoho_id:                      fianzaZohoId,
    name:                                d.Name,
    id_garantia:                         d.Id_Garantia,
    stage:                               d.Stage,
    fase:                                d.Fase_Bigin ?? null,
    fase_previa:                         d.Fase_Previa ?? null,
    renovacion_n:                        d.Renovacion_N ?? null,
    estado_contrato:                     d.Estado_del_Contrato ?? null,
    tipo_alquiler:                       d.Tipo_de_Alquiler ?? null,
    tipo_duracion:                       d.Tipo_de_Duracion ?? null,
    nombre_contacto:                     d.Contact_Name?.name ?? null,
    arrendatario_principal:              d.Arrendatario_Principal?.name ?? null,
    arrendador:                          d.Arrendador?.name ?? null,
    nombre_inmobiliaria:                 d.Account_Name?.name ?? null,
    analytics_agente:                    d.Analytics_Agente ?? null,
    comercial_garantiaya:                d.Comercial_GarantiaYa ?? null,
    correo_comercial:                    d.Correo_Comercial ?? null,
    sucursal:                            d.Sucursal ?? null,
    gestor_renovacion:                   d.Gestor_Renovacion?.name ?? null,
    amount:                              d.Amount ?? null,
    precio_final:                        d.Precio_Final ?? null,
    alquiler:                            d.Alquiler ?? null,
    alquiler_total:                      d.Alquiler_Total ?? null,
    closing_date:                        d.Closing_Date ?? null,
    fecha_inicio_garantia:               d.Fecha_Inicio_de_Garantia ?? null,
    fecha_finalizacion_garantia:         d.Fecha_Finalizacion_de_Garantia ?? null,
    fecha_proxima_renovacion:            d.Fecha_Proxima_Renovacion ?? null,
    fecha_firma_contrato_arrendamiento:  d.Fecha_Firma_Contrato_de_Arrendamiento ?? null,
    fecha_inicio_contrato_arrendamiento: d.Fecha_de_Inicio_de_Contrato_de_Arrendamiento ?? null,
    fecha_renovacion:                    d.Fecha_de_Renovacion ?? null,
    fecha_fase:                          d.Fecha_Fase ?? null,
    direccion_completa:                  d.Direccion_Propiedad ?? null,
    zoho_modified_time:                  d.Modified_Time ?? null,
    synced_at:                           new Date().toISOString(),
  };
}

function mapRecupero(d, fianzaZohoId) {
  return {
    zoho_id:               d.id,
    fianza_zoho_id:        fianzaZohoId,
    name:                  d.Name,
    id_garantia:           d.Id_Garantia ?? null,
    fase:                  d.Fase ?? null,
    estado_contrato:       d.Estado_del_Contrato ?? null,
    estado_recupero:       d.Estado_Recupero ?? null,
    categoria_garantia:    d.Categoria_de_Garantia ?? null,
    tipo_alquiler:         d.Tipo_de_Alquiler ?? null,
    arrendatario_principal: d.Arrendatario_Principal?.name ?? null,
    arrendador:            d.Arrendador?.name ?? null,
    nombre_inmobiliaria:   d.Nombre_de_Inmobiliaria?.name ?? null,
    analytics_agente:      d.Analytics_Agente ?? null,
    comercial_garantiaya:  d.Comercial_GarantiaYa1 ?? null,
    correo_comercial:      d.Correo_Comercial ?? null,
    sucursal:              d.Sucursal ?? null,
    gestor_recupero:       d.Gestor_Recupero1 ?? null,
    alquiler:              d.Alquiler ?? null,
    total_reclamos:        d.Total_Reclamos ?? null,
    total_pagado:          d.Total_Pagado1 ?? null,
    saldo_pendiente:       d.Saldo_Pendiente1 ?? null,
    total_conciliado:      d.Total_Conciliado ?? null,
    total_recuperado:      d.Total_Recuperado1 ?? null,
    total_desestimado:     d.Total_Desestimado ?? null,
    total_improcedente:    d.Total_Improcedente ?? null,
    total_gastos_legales:  d.Total_Gastos_Legales ?? null,
    fecha_primera_venta:   d.Fecha_Primera_Venta ?? null,
    fecha_1ra_notificacion: d.Fecha_1ra_Notificacion ?? null,
    fecha_de_pago:         d.Fecha_de_Pago ?? null,
    fecha_de_cierre:       d.Fecha_de_Cierre ?? null,
    direccion_completa:    d.Direccion_Propiedad ?? null,
    legales:               d.Legales ?? false,
    incobrable:            d.Incobrable ?? false,
    deposito_x_impago:     d.Deposito_x_Impago ?? false,
    zoho_modified_time:    d.Modified_Time ?? null,
    synced_at:             new Date().toISOString(),
  };
}

function mapNotificacion(d, fianzaZohoId) {
  return {
    zoho_id:                   d.id,
    fianza_zoho_id:            fianzaZohoId,
    name:                      d.Name,
    id_garantia:               d.Id_Garantia ?? null,
    fase:                      d.Fase ?? null,
    estado_contrato:           d.Estado_del_Contrato ?? null,
    conceptos:                 d.Conceptos ?? null,
    periodo_mes:               d.Periodo_Mes ?? null,
    periodo_ano:               d.Periodo_A_o ?? null,
    tipo_alquiler:             d.Tipo_Alquiler ?? null,
    categoria_garantia:        d.Categoria_de_Garantia ?? null,
    arrendatario_principal:    d.Arrendatario_Principal?.name ?? null,
    arrendatario_nombre:       d.Arrendatario_Nombre ?? null,
    arrendatario_apellido:     d.Arrendatario_Apellido ?? null,
    arrendador_nombre:         d.Arrendador_Nombre ?? null,
    arrendador_email:          d.Arrendador_Email ?? null,
    nombre_inmobiliaria:       d.Nombre_de_Inmobiliaria?.name ?? null,
    analytics_agente:          d.Analytics_Agente ?? null,
    comercial_garantiaya:      d.Comercial_GarantiaYa ?? null,
    correo_comercial:          d.Correo_Comercial ?? null,
    sucursal:                  d.Sucursal ?? null,
    gestor_impagos:            d.Gestor_Impagos?.name ?? null,
    alquiler:                  d.Alquiler ?? null,
    importe:                   d.Importe1 ?? d.Importe ?? null,
    saldo_recupera:            d.Saldo_Recupera ?? null,
    saldo_desestimado:         d.Saldo_Desestimado ?? null,
    valor_deposito:            d.Valor_Deposito ?? null,
    fecha_de_pago:             d.Fecha_de_Pago ?? null,
    fecha_de_pago_acordada:    d.Fecha_de_Pago_Acordada ?? null,
    fecha_desestimada:         d.Fecha_Desestimada ?? null,
    fecha_de_cierre:           d.Fecha_de_Cierre ?? null,
    fecha_envio_burofax:       d.Fecha_Envio_Burofax ?? null,
    direccion_completa:        d.Direccion_Propiedad ?? null,
    direccion:                 d.Direccion ?? null,
    legales:                   d.Legales ?? false,
    deposito_x_impago:         d.Deposito_x_Impago ?? false,
    tiene_avalista:            d.Tiene_Avalista ?? false,
    zoho_modified_time:        d.Modified_Time ?? null,
    synced_at:                 new Date().toISOString(),
  };
}

function mapLegal(d, fianzaZohoId) {
  return {
    zoho_id:                            d.id,
    fianza_zoho_id:                     fianzaZohoId,
    name:                               d.Name,
    id_garantia:                        d.ID_Garantia ?? null,
    fase_legal:                         d.Fase_Legal ?? null,
    estado_contrato:                    d.Estado_del_Contrato ?? null,
    tipo_alquiler:                      d.Tipo_de_Alquiler ?? null,
    arrendatario_principal:             d.Arrendatario_Principal?.name ?? null,
    arrendador:                         d.Arrendador?.name ?? null,
    nombre_inmobiliaria:                d.Inmobiliaria?.name ?? null,
    analytics_agente:                   d.Analytics_Agente ?? null,
    comercial:                          d.Comercial ?? null,
    correo_comercial:                   d.Correo_Comercial ?? null,
    gestor_legal:                       d.Gestor_Legal ?? null,
    agente_inmobiliario:                d.Agente_Inmobiliario?.name ?? null,
    alquiler:                           d.Alquiler ?? null,
    saldo_recuperado:                   d.Saldo_Recuperado ?? null,
    saldo_pendiente:                    d.Saldo_Pendiente ?? null,
    valor_acuerdo_pago:                 d.Valor_Acuerdo_de_Pago ?? null,
    total_gastos_legales:               d.Total_Gastos_Legales ?? null,
    fecha_firma_contrato_arrendamiento: d.Fecha_de_Firma_Contrato_de_Arrendamiento ?? null,
    fecha_inicio_demanda:               d.Fecha_de_inicio_de_demanda ?? null,
    fecha_envio_burofax:                d.Fecha_de_env_o_de_burofax ?? null,
    fecha_notificacion_burofax:         d.Fecha_de_notificaci_n_del_Burofax ?? null,
    fecha_envio_legales:                d.Fecha_de_env_o_a_legales ?? null,
    fecha_juicio:                       d.Fecha_de_juicio ?? null,
    fecha_lanzamiento:                  d.Fecha_de_lanzamiento ?? null,
    fecha_recuperacion_vivienda:        d.Fecha_de_recuperaci_n_de_vivienda ?? null,
    fecha_de_cierre:                    d.Fecha_de_Cierre ?? null,
    direccion_completa:                 d.Direccion_Propiedad ?? null,
    caso_activo:                        d.Caso_Activo ?? false,
    caso_finalizado:                    d.Caso_finalizado ?? false,
    legales:                            d.Legales ?? false,
    embargo:                            d.Embargo ?? false,
    acuerdo_de_pago:                    d.Acuerdo_de_pago ?? false,
    expediente_paralizado:              d.Expediente_paralizado ?? false,
    tiene_avalistas:                    d.Tiene_Avalistas ?? false,
    numero_expediente:                  d.Numero_Expendiente ?? null,
    tipo_procedimiento:                 d.Tipo_de_procedimiento ?? null,
    zoho_modified_time:                 d.Modified_Time ?? null,
    synced_at:                          new Date().toISOString(),
  };
}

async function upsertBatch(table, rows) {
  if (rows.length === 0) return 0;
  const CHUNK = 100;
  let saved = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from(table)
      .upsert(rows.slice(i, i + CHUNK), { onConflict: 'zoho_id' });
    if (error) throw new Error(`Supabase upsert error [${table}]: ${error.message}`);
    saved += rows.slice(i, i + CHUNK).length;
  }
  return saved;
}

async function main() {
  console.log('🚀 Iniciando sync módulos relacionados → Supabase');
  const token   = await getAccessToken();
  const fianzas = await getFianzasIds();

  const FIELDS_RENOVACIONES   = 'id,Name,Id_Garantia,Stage,Fase_Bigin,Fase_Previa,Renovacion_N,Estado_del_Contrato,Tipo_de_Alquiler,Tipo_de_Duracion,Contact_Name,Arrendatario_Principal,Arrendador,Account_Name,Analytics_Agente,Comercial_GarantiaYa,Correo_Comercial,Sucursal,Gestor_Renovacion,Amount,Precio_Final,Alquiler,Alquiler_Total,Closing_Date,Fecha_Inicio_de_Garantia,Fecha_Finalizacion_de_Garantia,Fecha_Proxima_Renovacion,Fecha_Firma_Contrato_de_Arrendamiento,Fecha_de_Inicio_de_Contrato_de_Arrendamiento,Fecha_de_Renovacion,Fecha_Fase,Direccion_Propiedad,Modified_Time';
  const FIELDS_RECUPERO       = 'id,Name,Id_Garantia,Fase,Estado_del_Contrato,Estado_Recupero,Categoria_de_Garantia,Tipo_de_Alquiler,Arrendatario_Principal,Arrendador,Nombre_de_Inmobiliaria,Analytics_Agente,Comercial_GarantiaYa1,Correo_Comercial,Sucursal,Gestor_Recupero1,Alquiler,Total_Reclamos,Total_Pagado1,Saldo_Pendiente1,Total_Conciliado,Total_Recuperado1,Total_Desestimado,Total_Improcedente,Total_Gastos_Legales,Fecha_Primera_Venta,Fecha_1ra_Notificacion,Fecha_de_Pago,Fecha_de_Cierre,Direccion_Propiedad,Legales,Incobrable,Deposito_x_Impago,Modified_Time';
  const FIELDS_NOTIFICACIONES = 'id,Name,Id_Garantia,Fase,Estado_del_Contrato,Conceptos,Periodo_Mes,Periodo_A_o,Tipo_Alquiler,Categoria_de_Garantia,Arrendatario_Principal,Arrendatario_Nombre,Arrendatario_Apellido,Arrendador_Nombre,Arrendador_Email,Nombre_de_Inmobiliaria,Analytics_Agente,Comercial_GarantiaYa,Correo_Comercial,Sucursal,Gestor_Impagos,Alquiler,Importe1,Saldo_Recupera,Saldo_Desestimado,Valor_Deposito,Fecha_de_Pago,Fecha_de_Pago_Acordada,Fecha_Desestimada,Fecha_de_Cierre,Fecha_Envio_Burofax,Direccion_Propiedad,Direccion,Legales,Deposito_x_Impago,Tiene_Avalista,Modified_Time';
  const FIELDS_LEGALES        = 'id,Name,ID_Garantia,Fase_Legal,Estado_del_Contrato,Tipo_de_Alquiler,Arrendatario_Principal,Arrendador,Inmobiliaria,Analytics_Agente,Comercial,Correo_Comercial,Gestor_Legal,Agente_Inmobiliario,Alquiler,Saldo_Recuperado,Saldo_Pendiente,Valor_Acuerdo_de_Pago,Total_Gastos_Legales,Fecha_de_Firma_Contrato_de_Arrendamiento,Fecha_de_inicio_de_demanda,Fecha_de_env_o_de_burofax,Fecha_de_notificaci_n_del_Burofax,Fecha_de_env_o_a_legales,Fecha_de_juicio,Fecha_de_lanzamiento,Fecha_de_recuperaci_n_de_vivienda,Fecha_de_Cierre,Direccion_Propiedad,Caso_Activo,Caso_finalizado,Legales,Embargo,Acuerdo_de_pago,Expediente_paralizado,Tiene_Avalistas,Numero_Expendiente,Tipo_de_procedimiento,Modified_Time';

  let totalRenovaciones   = 0;
  let totalRecuperos      = 0;
  let totalNotificaciones = 0;
  let totalLegales        = 0;

  // Procesar de 10 en 10 para no saturar Zoho
  const CHUNK = 10;
  for (let i = 0; i < fianzas.length; i += CHUNK) {
    const batch = fianzas.slice(i, i + CHUNK);

    const results = await Promise.all(batch.map(async ({ zoho_id }) => {
      const [renovaciones, recuperos, notificaciones, legales] = await Promise.all([
        fetchByFianzaId(token, 'Renovaciones', zoho_id, FIELDS_RENOVACIONES),
        fetchByFianzaId(token, 'Impagos_Recuperos', zoho_id, FIELDS_RECUPERO),
        fetchByFianzaId(token, 'Impagos_Notificaciones', zoho_id, FIELDS_NOTIFICACIONES),
        fetchLegalesByFianzaId(token, zoho_id, FIELDS_LEGALES),
      ]);
      return { zoho_id, renovaciones, recuperos, notificaciones, legales };
    }));

    // Agrupar rows del batch
    const batchRenovaciones   = results.flatMap(r => r.renovaciones.map(d => mapRenovacion(d, r.zoho_id)));
    const batchRecuperos      = results.flatMap(r => r.recuperos.map(d => mapRecupero(d, r.zoho_id)));
    const batchNotificaciones = results.flatMap(r => r.notificaciones.map(d => mapNotificacion(d, r.zoho_id)));
    const batchLegales        = results.flatMap(r => r.legales.map(d => mapLegal(d, r.zoho_id)));

    // Guardar inmediatamente
    const [s1, s2, s3, s4] = await Promise.all([
      upsertBatch('renovaciones', batchRenovaciones),
      upsertBatch('impagos_recupero', batchRecuperos),
      upsertBatch('impagos_notificaciones', batchNotificaciones),
      upsertBatch('impagos_legales', batchLegales),
    ]);

    totalRenovaciones   += s1;
    totalRecuperos      += s2;
    totalNotificaciones += s3;
    totalLegales        += s4;

    process.stdout.write(`\r⏳ ${Math.min(i + CHUNK, fianzas.length)}/${fianzas.length} | Ren:${totalRenovaciones} Rec:${totalRecuperos} Not:${totalNotificaciones} Leg:${totalLegales}`);
  }

  console.log('\n');
  console.log('✅ Sync completado:');
  console.log(`   Renovaciones:     ${totalRenovaciones}`);
  console.log(`   Recuperos:        ${totalRecuperos}`);
  console.log(`   Notificaciones:   ${totalNotificaciones}`);
  console.log(`   Legales:          ${totalLegales}`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
