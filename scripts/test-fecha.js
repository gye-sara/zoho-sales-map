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

  // Prueba con If-Modified-Since header
  const since = new Date('2026-04-30T00:00:00Z').toUTCString();
  console.log('Since:', since);

  const res = await fetch(
    'https://www.zohoapis.eu/crm/v7/Deals?fields=id,Deal_Name,Modified_Time,Stage&per_page=5&page=1',
    {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'If-Modified-Since': since,
      }
    }
  );
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Total:', data.data?.length ?? 0);
  console.log('Error:', data.code ?? 'none');
  if (data.data?.length > 0) {
    console.log('First:', data.data[0].Deal_Name, data.data[0].Modified_Time);
  }
}

main().catch(console.error);
