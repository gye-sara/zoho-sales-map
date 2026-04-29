import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const KEY = process.env.GOOGLE_MAPS_KEY;

async function geocode(address) {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ', España')}&key=${KEY}`
  );
  const data = await res.json();
  if (data.status === 'OK') {
    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng, formatted: data.results[0].formatted_address };
  }
  return { lat: null, lng: null, formatted: `NO ENCONTRADO (${data.status})` };
}

const addresses = [
  "C. Giner de los Ríos, 7, 03140 Guardamar del Segura, Alicante",
  "CL RIO TAJO, 734 (URB. LAS COLINAS) 19170 EL CASAR (GUADALAJARA)",
  "AV DE JUAN ANTONIO SAMARANCH 53",
  "Av. de Bernat Guinovart 1a, bajo 3, 46680. Algemesí",
  "Via Augusta 100 1ro.2da,08006",
  "Plaça dels Pescadors, 8, entresuelo izquierdo, 03140 Guardamar del Segura, Alicante",
];

async function main() {
  for (const addr of addresses) {
    const result = await geocode(addr);
    console.log(`\n📍 ${addr}`);
    console.log(`   → ${result.formatted}`);
    console.log(`   → ${result.lat}, ${result.lng}`);
  }
}

main().catch(console.error);
