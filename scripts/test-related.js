import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

async function getAccessToken() {
  const res = await fetch('https://accounts.zoho.eu/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      client_id:     process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      grant_type:    'refresh_token',
    }),
  });
  return (await res.json()).access_token;
}

async function main() {
  const token = await getAccessToken();
  const fianzaId = '893573000004726068';

  // Prueba 1: id_ticket_fianzas
  const r1 = await fetch(
    `https://www.zohoapis.eu/crm/v7/Renovaciones/search?criteria=${encodeURIComponent(`(id_ticket_fianzas:equals:${fianzaId})`)}&fields=id,Name&per_page=5`,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
  );
  console.log('id_ticket_fianzas:', await r1.text());

  // Prueba 2: Fianza (campo lookup)
  const r2 = await fetch(
    `https://www.zohoapis.eu/crm/v7/Renovaciones/search?criteria=${encodeURIComponent(`(Fianza:equals:${fianzaId})`)}&fields=id,Name&per_page=5`,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
  );
  console.log('Fianza:', await r2.text());

  // Prueba 3: Garantia
  const r3 = await fetch(
    `https://www.zohoapis.eu/crm/v7/Renovaciones/search?criteria=${encodeURIComponent(`(Garantia:equals:${fianzaId})`)}&fields=id,Name&per_page=5`,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
  );
  console.log('Garantia:', await r3.text());
}

main().catch(console.error);
