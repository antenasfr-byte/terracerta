// Test the plant-diagnosis edge function with a real plant photo.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awafafmwbcrhjboefbzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWZhZm13YmNyaGpib2VmYnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3OTQ1MzUsImV4cCI6MjEwMDM3MDUzNX0.zs1yqpsH7qPbqGwtapSlLBte4sFRyVCopA7n_8OZuoM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Sign in with the test account (user already created via SQL)
const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
  email: 'test@terracerta.pt',
  password: 'TerraCerta2026!QA',
});

if (signInErr) {
  console.error('SIGNIN ERROR:', JSON.stringify(signInErr));
  process.exit(1);
}

const accessToken = signInData.session.access_token;
console.log('Signed in as test@terracerta.pt, token:', accessToken ? 'yes' : 'no');

// Download a real plant photo from Pexels
const photoUrl = 'https://images.pexels.com/photos/4751978/pexels-photo-4751978.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop';
const photoRes = await fetch(photoUrl);
if (!photoRes.ok) {
  console.error('PHOTO DOWNLOAD ERROR:', photoRes.status);
  process.exit(1);
}
const photoBuf = await photoRes.arrayBuffer();
const base64 = Buffer.from(photoBuf).toString('base64');
console.log('Photo size (base64):', base64.length, 'chars');

// Call the edge function
const funcUrl = `${SUPABASE_URL}/functions/v1/plant-diagnosis`;
const res = await fetch(funcUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({
    imageBase64: base64,
    part: 'folha',
    plantName: 'Tomateiro',
    region: 'Lisboa',
    symptoms: 'manchas nas folhas',
    watering: 'normal',
    sunExposure: 'sol-pleno',
  }),
});

console.log('\n=== HTTP STATUS ===');
console.log(res.status, res.statusText);

const data = await res.json();
console.log('\n=== RESPONSE JSON ===');
console.log(JSON.stringify(data, null, 2));
