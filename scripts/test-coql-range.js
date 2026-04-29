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

  // Prueba con where por id > valor (cursor pagination)
  const queries = [
    `select id, Account_Name from Accounts where id > '0' limit 200 offset 0`,
    `select id, Account_Name from Accounts where id > '0' limit 200 offset 200`,
    `select id, Account_Name from Accounts where id > '0' limit 200 offset 2000`,
    `select id, Account_Name from Accounts where id > '0' limit 200 offset 4000`,
  ];

  for (const q of queries) {
    const res = await fetch('https://www.zohoapis.eu/crm/v7/coql', {
      method: 'POST',
      headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ select_query: q }),
    });
    const data = await res.json();
    console.log(`offset ${q.match(/offset (\d+)/)?.[1]} — Total: ${data.data?.length} | More: ${data.info?.more_records} | Error: ${data.code ?? 'none'}`);
  }
}

main().catch(console.error);
