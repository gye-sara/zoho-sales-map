import { useState } from 'react';

export default function RangoAlquiler({ value, onChange }) {
  const [minInput, setMinInput] = useState(value?.min ?? '');
  const [maxInput, setMaxInput] = useState(value?.max ?? '');

  const apply = (newMin, newMax) => {
    const min = newMin !== '' ? Number(newMin) : undefined;
    const max = newMax !== '' ? Number(newMax) : undefined;
    if (!min && !max) {
      onChange(null);
    } else {
      onChange({ min: min ?? 0, max: max ?? 999999 });
    }
  };

  const isActive = value?.min != null || value?.max != null;

  const presets = [
    { label: 'Hasta €500',      min: 0,    max: 500   },
    { label: '€500 — €1.000',   min: 500,  max: 1000  },
    { label: '€1.000 — €2.000', min: 1000, max: 2000  },
    { label: '€2.000 — €3.000', min: 2000, max: 3000  },
    { label: '+€3.000',         min: 3000, max: null   },
  ];

  return (
    <div style={{ marginTop:'14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
        <label style={{ fontSize:'11px', fontWeight:600, color:'#888', textTransform:'uppercase', letterSpacing:'0.4px' }}>
          Rango de alquiler
        </label>
        {isActive && (
          <button
            onClick={() => { onChange(null); setMinInput(''); setMaxInput(''); }}
            style={{ background:'none', border:'none', fontSize:'11px', color:'#6366f1', cursor:'pointer', fontWeight:600 }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Presets rápidos */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px' }}>
        {presets.map(p => {
          const isSelected = value?.min === (p.min ?? 0) && value?.max === (p.max ?? 999999);
          return (
            <button
              key={p.label}
              onClick={() => {
                if (isSelected) {
                  onChange(null); setMinInput(''); setMaxInput('');
                } else {
                  onChange({ min: p.min ?? 0, max: p.max ?? 999999 });
                  setMinInput(String(p.min ?? ''));
                  setMaxInput(p.max ? String(p.max) : '');
                }
              }}
              style={{
                padding:'4px 10px', borderRadius:'20px',
                border: isSelected ? '2px solid #1a1a2e' : '1px solid #ddd',
                background: isSelected ? '#1a1a2e' : 'white',
                color: isSelected ? 'white' : '#333',
                fontSize:'11px', fontWeight: isSelected ? 600 : 400,
                cursor:'pointer', whiteSpace:'nowrap',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Inputs manuales */}
      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
        <div style={{ flex:1, position:'relative' }}>
          <span style={{ position:'absolute', left:'8px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'#aaa' }}>€</span>
          <input
            type="number"
            placeholder="Mínimo"
            value={minInput}
            onChange={e => setMinInput(e.target.value)}
            onBlur={() => apply(minInput, maxInput)}
            onKeyDown={e => e.key === 'Enter' && apply(minInput, maxInput)}
            style={{ width:'100%', padding:'7px 8px 7px 20px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'13px', boxSizing:'border-box', outline:'none' }}
          />
        </div>
        <span style={{ color:'#ccc', fontSize:'14px' }}>—</span>
        <div style={{ flex:1, position:'relative' }}>
          <span style={{ position:'absolute', left:'8px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'#aaa' }}>€</span>
          <input
            type="number"
            placeholder="Máximo"
            value={maxInput}
            onChange={e => setMaxInput(e.target.value)}
            onBlur={() => apply(minInput, maxInput)}
            onKeyDown={e => e.key === 'Enter' && apply(minInput, maxInput)}
            style={{ width:'100%', padding:'7px 8px 7px 20px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'13px', boxSizing:'border-box', outline:'none' }}
          />
        </div>
      </div>
    </div>
  );
}
