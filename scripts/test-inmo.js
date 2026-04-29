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
  let total = 0;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(
      `https://www.zohoapis.eu/crm/v7/Accounts?fields=id,Account_Name&per_page=200&page=${page}`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );
    const data = await res.json();
    if (!data.data || data.data.length === 0) break;
    total += data.data.length;
    hasMore = data.info?.more_records ?? false;
    page++;
    process.stdout.write(`\r📦 ${total} cuentas encontradas...`);
  }
  console.log(`\n✅ Total cuentas en Zoho: ${total}`);
}

main().catch(console.error);
