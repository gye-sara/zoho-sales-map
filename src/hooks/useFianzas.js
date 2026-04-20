import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useFianzas(filtros = {}) {
  const [fianzas, setFianzas]           = useState([]);
  const [sinUbicacion, setSinUbicacion] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // ── 1. Fianzas CON coordenadas (para el mapa) ─────────────────
        let allData = [];
        let page = 0;
        const PAGE_SIZE = 1000;

        while (true) {
          let query = supabase
            .from('fianzas')
            .select('zoho_id,deal_name,id_garantia,nombre_contacto,nombre_inmobiliaria,comercial_garantiaya,analytics_agente,sucursal,provincia,ciudad,direccion_completa,lat,lng,amount,alquiler,estado_contrato,calidad_geocodificacion,fecha_inicio_garantia,fecha_finalizacion_garantia,tipo_alquiler,categoria_garantia')
            .not('lat', 'is', null)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

          if (filtros.sucursal)         query = query.eq('sucursal', filtros.sucursal);
          if (filtros.analytics_agente) query = query.eq('analytics_agente', filtros.analytics_agente);
          if (filtros.estado)           query = query.eq('estado_contrato', filtros.estado);
          if (filtros.categoria)        query = query.eq('categoria_garantia', filtros.categoria);
          if (filtros.fechaDesde)       query = query.gte('fecha_inicio_garantia', filtros.fechaDesde);
          if (filtros.fechaHasta)       query = query.lte('fecha_inicio_garantia', filtros.fechaHasta);

          const { data, error } = await query;
          if (error) throw error;
          if (!data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < PAGE_SIZE) break;
          page++;
        }

        // ── 2. Contar las SIN coordenadas (mismos filtros) ────────────
        let countQuery = supabase
          .from('fianzas')
          .select('zoho_id', { count: 'exact', head: true })
          .is('lat', null);

        if (filtros.sucursal)         countQuery = countQuery.eq('sucursal', filtros.sucursal);
        if (filtros.analytics_agente) countQuery = countQuery.eq('analytics_agente', filtros.analytics_agente);
        if (filtros.estado)           countQuery = countQuery.eq('estado_contrato', filtros.estado);
        if (filtros.categoria)        countQuery = countQuery.eq('categoria_garantia', filtros.categoria);
        if (filtros.fechaDesde)       countQuery = countQuery.gte('fecha_inicio_garantia', filtros.fechaDesde);
        if (filtros.fechaHasta)       countQuery = countQuery.lte('fecha_inicio_garantia', filtros.fechaHasta);

        const { count } = await countQuery;

        setFianzas(allData);
        setSinUbicacion(count ?? 0);
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
