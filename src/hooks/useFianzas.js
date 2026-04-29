import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useFianzas(filtros = {}) {
  const [fianzas, setFianzas]           = useState([]);
  const [sinUbicacion, setSinUbicacion] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const hayFiltros = Object.values(filtros).some(Boolean);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let allData = [];
        let page = 0;
        const PAGE_SIZE = 1000;

        while (true) {
          let query = supabase
            .from('fianzas')
            .select(`
              zoho_id, deal_name, id_garantia, nombre_contacto,
              nombre_inmobiliaria, comercial_garantiaya, analytics_agente,
              sucursal, provincia, ciudad, direccion_completa,
              lat, lng, amount, alquiler, estado_contrato, stage,
              calidad_geocodificacion, fecha_inicio_garantia,
              fecha_finalizacion_garantia, closing_date,
              duracion_contrato_meses, tipo_alquiler, categoria_garantia,
              renovaciones(id, name, stage, renovacion_n, closing_date, amount, estado_contrato),
              impagos_recupero(id, name, fase, total_reclamos, saldo_pendiente, total_pagado),
              impagos_notificaciones(id, name, fase, periodo_mes, periodo_ano, importe),
              impagos_legales(id, name, fase_legal, caso_activo, saldo_pendiente, saldo_recuperado)
            `)
            .eq('stage', 'Póliza Vendida')
            .not('lat', 'is', null)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

          if (filtros.sucursal)         query = query.eq('sucursal', filtros.sucursal);
          if (filtros.analytics_agente) query = query.eq('analytics_agente', filtros.analytics_agente);
          if (filtros.inmobiliaria)     query = query.eq('nombre_inmobiliaria', filtros.inmobiliaria);
          if (filtros.estado)           query = query.eq('estado_contrato', filtros.estado);
          if (filtros.categoria)        query = query.eq('categoria_garantia', filtros.categoria);
          if (filtros.fechaDesde)       query = query.gte('closing_date', filtros.fechaDesde);
          if (filtros.fechaHasta)       query = query.lte('closing_date', filtros.fechaHasta);
          if (filtros.rangoAlquiler?.min != null) query = query.gte('alquiler', filtros.rangoAlquiler.min);
          if (filtros.rangoAlquiler?.max != null && filtros.rangoAlquiler.max !== 999999) query = query.lte('alquiler', filtros.rangoAlquiler.max);

          const { data, error } = await query;
          if (error) throw error;
          if (!data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < PAGE_SIZE) break;
          page++;
        }

        if (filtros.conRenovaciones)   allData = allData.filter(f => f.renovaciones?.length > 0);
        if (filtros.conRecuperos)      allData = allData.filter(f => f.impagos_recupero?.length > 0);
        if (filtros.conNotificaciones) allData = allData.filter(f => f.impagos_notificaciones?.length > 0);
        if (filtros.conLegales)        allData = allData.filter(f => f.impagos_legales?.length > 0);

        let sinUbicacionCount = 0;
        if (!hayFiltros) {
          const { count } = await supabase
            .from('fianzas')
            .select('zoho_id', { count: 'exact', head: true })
            .eq('stage', 'Póliza Vendida')
            .is('lat', null);
          sinUbicacionCount = count ?? 0;
        }

        setFianzas(allData);
        setSinUbicacion(sinUbicacionCount);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [JSON.stringify(filtros)]);

  return { fianzas, sinUbicacion, loading, error };
}
