import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
import * as kv from './kv_store.tsx';

// Helper to convert base64 to Uint8Array safely in Deno
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const app = new Hono();

app.use('*', cors());
app.use('*', logger());
app.options('*', (c) => c.text('', 204));

const BUCKET_NAME = 'make-84bb53da-images';

const getSupabase = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );
};

async function ensureBucket(supabase: any) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b: any) => b.name === BUCKET_NAME);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET_NAME, { public: false });
  }
}

const handleGetReports = async (c: any) => {
  try {
    const supabase = getSupabase();
    const rawReports = await kv.getByPrefix('report_');
    
    const reports = await Promise.all(rawReports.map(async (r: any) => {
      let citizenImage = r.citizenImage;
      let workerImage = r.workerImage;
      
      if (r.citizenImagePath) {
        const { data } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(r.citizenImagePath, 3600);
        if (data?.signedUrl) citizenImage = data.signedUrl;
      }
      if (r.workerImagePath) {
        const { data } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(r.workerImagePath, 3600);
        if (data?.signedUrl) workerImage = data.signedUrl;
      }
      
      return { ...r, citizenImage, workerImage };
    }));
    
    reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return c.json({ reports });
  } catch (err) {
    console.error("GET /reports error", err);
    return c.json({ error: String(err) }, 500);
  }
};

app.get('/reports', handleGetReports);
app.get('/make-server-84bb53da/reports', handleGetReports);

const handlePostReports = async (c: any) => {
  try {
    const supabase = getSupabase();
    await ensureBucket(supabase);
    
    const body = await c.req.json();
    const { id, citizenImageBase64, location, date } = body;
    
    let citizenImagePath = null;
    if (citizenImageBase64) {
      const base64Data = citizenImageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = base64ToUint8Array(base64Data);
      const fileName = `${id}-citizen-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, buffer, { contentType: 'image/jpeg' });
      if (error) throw error;
      citizenImagePath = fileName;
    }

    const report = { id, status: 'Pending', date, location, citizenImagePath };
    await kv.set(`report_${id}`, report);
    return c.json({ success: true, report });
  } catch (err) {
    console.error("POST /reports error", err);
    return c.json({ error: String(err) }, 500);
  }
};

app.post('/reports', handlePostReports);
app.post('/make-server-84bb53da/reports', handlePostReports);

const handlePutReports = async (c: any) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabase();
    await ensureBucket(supabase);
    
    const body = await c.req.json();
    const { workerImageBase64, status, integrityScore, cleanlinessScore } = body;
    
    let workerImagePath = null;
    if (workerImageBase64) {
      const base64Data = workerImageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = base64ToUint8Array(base64Data);
      const fileName = `${id}-worker-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, buffer, { contentType: 'image/jpeg' });
      if (error) throw error;
      workerImagePath = fileName;
    }

    const existing: any = await kv.get(`report_${id}`);
    if (!existing) return c.json({ error: "Not found" }, 404);

    const updated = { ...existing, status, integrityScore, cleanlinessScore };
    if (workerImagePath) updated.workerImagePath = workerImagePath;
    
    await kv.set(`report_${id}`, updated);
    return c.json({ success: true, report: updated });
  } catch (err) {
    console.error("PUT /reports/:id error", err);
    return c.json({ error: String(err) }, 500);
  }
};

app.put('/reports/:id', handlePutReports);
app.put('/make-server-84bb53da/reports/:id', handlePutReports);

Deno.serve(app.fetch);