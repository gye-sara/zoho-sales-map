import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useInmobiliarias(filtros = {}) {
  const [inmobiliarias, setInmobiliarias] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let allData = [];
        let page    = 0;
        const PAGE_SIZE = 1000;

        while (true) {
          let query = supabase
            .from('inmobiliarias')
            .select(`
              zoho_id, account_name, email, telefono, movil, website,
              comercial_garantiaya, analytics_agente, correo_comercial,
              billing_street, billing_city, billing_state,
              comision, comision_renovacion, comision_forma_pago,
              lat, lng, geocodificado, calidad_geocodificacion,
              total_deals, total_polizas, total_amount,
              renta_activa, marca, acuerdo_colaboracion
            `)
            .not('lat', 'is', null)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

          if (filtros.comercial)    query = query.eq('comercial_garantiaya', filtros.comercial);
          if (filtros.ciudad)       query = query.eq('billing_city', filtros.ciudad);
          if (filtros.conPolizas)   query = query.gt('total_polizas', 0);
          if (filtros.conDeals)     query = query.gt('total_deals', 0);
          if (filtros.marca)        query = query.eq('marca', true);
          if (filtros.acuerdo)      query = query.eq('acuerdo_colaboracion', true);

          const { data, error } = await query;
          if (error) throw error;
          if (!data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < PAGE_SIZE) break;
          page++;
        }

        setInmobiliarias(allData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [JSON.stringify(filtros)]);

  return { inmobiliarias, loading, error };
}
