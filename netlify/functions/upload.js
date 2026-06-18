// ============================================================
// Netlify Function: netlify/functions/upload.js
// Envía fotos en chunks pequeños al Apps Script
// ============================================================

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4YIdhQjkIWwDfVEWP5Qc-K2zpVocNi1ZikwCmE9bxwMA_o5OSwe-5SvflwbfwKXqc/exec';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
};

async function llamarAppsScript(params) {
  const url = SCRIPT_URL + '?' + new URLSearchParams(params).toString();
  const resp = await fetch(url, { redirect: 'follow' });
  const text = await resp.text();
  try { return JSON.parse(text); }
  catch(e) { return { error: 'respuesta invalida', raw: text.slice(0, 100) }; }
}

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod === 'GET') return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, message: 'Netlify Function activa', time: new Date().toISOString() }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const action = body.action || '';

    if (action === 'subirFoto') {
      const b64 = body.b64 || '';
      const orm = body.orm || '';
      const nombre = body.nombre || 'foto';
      const mime = body.mime || 'image/jpeg';
      const CHUNK = 5000; // 5KB por chunk - seguro para URLs de Apps Script

      console.log('subirFoto orm:', orm, 'nombre:', nombre, 'b64 length:', b64.length);

      // Enviar chunks
      const totalChunks = Math.ceil(b64.length / CHUNK);
      for (let i = 0; i < totalChunks; i++) {
        const chunk = b64.slice(i * CHUNK, (i + 1) * CHUNK);
        const result = await llamarAppsScript({
          action: 'recibirChunk',
          orm, nombre, mime,
          idx: i,
          total: totalChunks,
          chunk
        });
        console.log('Chunk', i+1, '/', totalChunks, ':', result.ok ? 'OK' : result.error);
        if (result.error) {
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Chunk ' + i + ' falló: ' + result.error }) };
        }
      }

      // Ensamblar y subir
      const finalResult = await llamarAppsScript({
        action: 'ensamblarFoto',
        orm, nombre, mime,
        total: totalChunks
      });

      console.log('Resultado final:', finalResult);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(finalResult) };
    }

    if (action === 'guardarInspeccion' || action === 'guardarRegistro' || action === 'guardarEjecucion') {
      const resp = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
        redirect: 'follow'
      });
      const text = await resp.text();
      try { return { statusCode: 200, headers: CORS_HEADERS, body: text }; }
      catch(e) { return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true }) }; }
    }

    if (action === 'eliminarRegistro') {
      const result = await llamarAppsScript({ action: 'eliminarRegistro', code: body.code || '' });
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result) };
    }

    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'acción desconocida: ' + action }) };

  } catch(e) {
    console.error('Error:', e);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: e.toString() }) };
  }
};
