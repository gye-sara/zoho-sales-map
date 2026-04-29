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

  // Prueba 1: buscar por ID directo con equals
  const q1 = `select id, Account_Name from Accounts where id = '893573000003941323' limit 1`;
  const r1 = await fetch('https://www.zohoapis.eu/crm/v7/coql', {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ select_query: q1 }),
  });
  console.log('Prueba equals:', await r1.text());

  // Prueba 2: buscar por nombre
  const q2 = `select id, Account_Name from Accounts where Account_Name = 'UNICASA RINCÓN DE LA VICTORIA' limit 1`;
  const r2 = await fetch('https://www.zohoapis.eu/crm/v7/coql', {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ select_query: q2 }),
  });
  console.log('Prueba nombre:', await r2.text());

  // Prueba 3: buscar por getRecordById
  const r3 = await fetch('https://www.zohoapis.eu/crm/v7/Accounts/893573000003941323', {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  console.log('Prueba getById:', (await r3.json())?.data?.[0]?.Account_Name ?? 'no encontrado');
}

main().catch(console.error);
