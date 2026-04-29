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
  return { lat: null, lng: null, formatted: 'NO ENCONTRADO' };
}

const addresses = [
  "Plaça dels Pescadors, 8, entresuelo izquierdo, 03140 Guardamar del Segura, Alicante",
  "San German 10 Madrid",
  "Calle Mayor 28-19001 - Guadalajara",
  "C/ Campamento 36, 46035 Valencia",
  "Via Augusta 100 1ro.2da,08006",
  "Av. de Bernat Guinovart 1a, bajo 3, 46680. Algemesí",
  "Pablo Neruda 17, Local 2",
  "Avenida General 16, local 15, 28042 Madrid",
  "Major 11,El Prat de Llobregat",
  "Avda. De San Luis 86 local 1",
  "CL RIO TAJO, 734 (URB. LAS COLINAS) 19170 EL CASAR (GUADALAJARA)",
  "Calle General Ricardos 107",
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
