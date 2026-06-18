// ============================================================
// ORM COBRA - Código.gs VERSIÓN NETLIFY FINAL
// ============================================================

var SHEET_ID = '1jYHm5nx6MzXzVppG-drTGZdTD7S8UIrC7Vl2iTjmlVQ';

function doGet(e) {
  var action = e && e.parameter && e.parameter.action ? e.parameter.action : '';

  // Sin action → servir la app
  if (!action) {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('ORM Cobra')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  var result = {};
  try {
    if (action === 'ping') {
      result = {ok: true, time: new Date().toISOString()};
    }
    else if (action === 'postes') {
      result = JSON.parse(getPosesData());
    }
    else if (action === 'buscarPoste') {
      result = buscarPosteHandler(e.parameter.q || '');
    }
    else if (action === 'registros') {
      result = JSON.parse(getRegistrosPlus());
    }
    else if (action === 'getInspeccion') {
      result = JSON.parse(getInspeccionPorORM(e.parameter.orm || ''));
    }
    else if (action === 'getFotoUrl') {
      result = getFotoUrl(e.parameter.orm || '', e.parameter.nombre || '');
    }
    else if (action === 'subirFoto') {
      var orm   = e.parameter.orm    || '';
      var nom   = e.parameter.nombre || 'foto';
      var mime  = e.parameter.mime   || 'image/jpeg';
      var b64   = e.parameter.b64    || '';
      result = b64 ? subirUnaFoto(orm, 'Inspeccion', nom, b64, mime) : {error: 'Sin b64'};
    }
    else if (action === 'recibirChunk') {
      var orm2   = e.parameter.orm    || '';
      var nom2   = e.parameter.nombre || 'foto';
      var mime2  = e.parameter.mime   || 'image/jpeg';
      var idx2   = parseInt(e.parameter.idx   || '0');
      var total2 = parseInt(e.parameter.total || '1');
      var chunk2 = e.parameter.chunk  || '';
      result = recibirChunkFoto(orm2, nom2, mime2, idx2, total2, chunk2);
    }
    else if (action === 'ensamblarFoto') {
      var orm3   = e.parameter.orm    || '';
      var nom3   = e.parameter.nombre || 'foto';
      var mime3  = e.parameter.mime   || 'image/jpeg';
      var total3 = parseInt(e.parameter.total || '1');
      result = ensamblarYSubirFoto(orm3, nom3, mime3, total3);
    }
    else if (action === 'getCarpetaId') {
      var orm4  = e.parameter.orm  || '';
      var tipo4 = e.parameter.tipo || 'Inspeccion';
      result = getCarpetaId(orm4, tipo4);
    }
    else if (action === 'guardarInspeccion' || action === 'guardarRegistro') {
      var dataStr = e.parameter.data || '{}';
      var parsed  = JSON.parse(dataStr);
      result = guardarRegistro(parsed);
    }
    else if (action === 'guardarEjecucion') {
      var dataStr2 = e.parameter.data || '{}';
      var parsed2  = JSON.parse(dataStr2);
      result = guardarRegistro(parsed2);
    }
    else if (action === 'eliminarRegistro') {
      result = eliminarRegistro(e.parameter.code || '');
    }
    else if (action === 'editarDetalle') {
      result = editarDetalle(e.parameter.code || '', e.parameter.det || '');
    }
    else if (action === 'obtenerTrabajos')  { result = obtenerTrabajosHandler_(e); }
    else if (action === 'previewTrabajos')  { result = previewTrabajosHandler_(e.parameter); }
    else if (action === 'importarTrabajos') { result = aplicarTrabajosHandler_(e.parameter); }
    else if (action === 'actualizarODM')    { result = actualizarOdmHandler_(e); }
    else {
      result = {error: 'Acción desconocida: ' + action};
    }
  } catch(err) {
    Logger.log('doGet error [' + action + ']: ' + err.toString());
    result = {error: err.toString()};
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = {};
    var action = '';
    try {
      var contents = e.postData ? e.postData.contents : '';
      Logger.log('postData type: ' + (e.postData ? e.postData.type : 'none'));
      Logger.log('contents length: ' + (contents ? contents.length : 0));

      if (contents && contents.trim().startsWith('{')) {
        body = JSON.parse(contents);
        action = body.action || '';
        Logger.log('Parsed JSON body, action: ' + action);
      } else if (e.parameter && e.parameter.action) {
        body = e.parameter;
        action = body.action;
        Logger.log('Using e.parameter, action: ' + action);
      } else {
        Logger.log('No se pudo leer el body');
      }
    } catch(pe) {
      Logger.log('Error parseando body: ' + pe.toString());
      body = e.parameter || {};
      action = body.action || '';
    }

    Logger.log('doPost action: ' + action);
    var result = {};

    if (action === 'subirFoto') {
      var b64val  = String(body.b64 || body.base64 || (e.parameter ? e.parameter.b64 : '') || '');
      var ormval  = String(body.orm || body.codigoORM || (e.parameter ? e.parameter.orm : '') || '');
      var nomval  = String(body.nombre || (e.parameter ? e.parameter.nombre : '') || 'foto');
      var mimeval = String(body.mime || (e.parameter ? e.parameter.mime : '') || 'image/jpeg');
      Logger.log('subirFoto - orm: ' + ormval + ' nombre: ' + nomval + ' b64 length: ' + b64val.length);
      result = b64val.length > 10 ? subirUnaFotoYCachear(ormval, 'Inspeccion', nomval, b64val, mimeval) : {error: 'b64 vacío'};
    }
    else if (action === 'guardarInspeccion' || action === 'guardarRegistro') {
      result = guardarRegistro(body);
    }
    else if (action === 'guardarEjecucion') {
      result = guardarRegistro(body);
    }
    else if (action === 'eliminarRegistro') {
      result = eliminarRegistro(String(body.code || ''));
    }
    else if (action === 'previewTrabajos') {
      result = previewTrabajosHandler_(body);
    }
    else if (action === 'importarTrabajos') {
      result = aplicarTrabajosHandler_(body);
    }
    else if (action === 'ping') {
      result = {ok: true, time: new Date().toISOString()};
    }
    else {
      result = {error: 'Acción desconocida: ' + action};
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    Logger.log('doPost error: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Sheet ──
function getSheet() {
  try {
    return SpreadsheetApp.openById(SHEET_ID);
  } catch(e) {
    Logger.log('Error abriendo Sheet: ' + e.toString());
    throw e;
  }
}

// ── Postes ──
function getPosesData() {
  try {
    var ss = SpreadsheetApp.openById('1soodRPLeyh__Oa-D8OGfVk1MEEzgOD2FdqzUKgqF-BI');
    var sheet = ss.getSheetByName('POSTES');
    if (!sheet) return JSON.stringify({error: 'Hoja POSTES no encontrada'});
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return JSON.stringify({});
    var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
    var result = {};
    data.forEach(function(row) {
      var id = String(row[0]).trim();
      var latlng = String(row[2]).trim().replace(/º/g, '').replace(/\s+/g, '');
      if (id && id !== 'undefined' && latlng) result[id] = latlng;
    });
    return JSON.stringify(result);
  } catch(e) {
    return JSON.stringify({error: e.toString()});
  }
}

// ── Subir foto ──
var FOTO_URLS_CACHE = {};

function subirUnaFoto(codigoORM, tipo, nombreFoto, base64Data, mimeType) {
  try {
    Logger.log('Subiendo foto: ' + nombreFoto + ' ORM: ' + codigoORM);
    var rootName = 'ORM Cobra - Inspecciones';
    var rootFolders = DriveApp.getFoldersByName(rootName);
    var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(rootName);

    var ormFolders = rootFolder.getFoldersByName(codigoORM);
    var ormFolder = ormFolders.hasNext() ? ormFolders.next() : rootFolder.createFolder(codigoORM);

    var tipoFolders = ormFolder.getFoldersByName(tipo);
    var tipoFolder = tipoFolders.hasNext() ? tipoFolders.next() : ormFolder.createFolder(tipo);

    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType || 'image/jpeg', nombreFoto + '.jpg');
    var file = tipoFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileId = file.getId();
    Logger.log('Foto subida OK: ' + fileId);

    return {
      ok: true,
      url: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=s1600',
      urlDownload: 'https://drive.google.com/uc?export=download&id=' + fileId,
      fileId: fileId
    };
  } catch(e) {
    Logger.log('Error subirFoto: ' + e.toString());
    return {error: e.toString()};
  }
}

function subirUnaFotoYCachear(orm, tipo, nombre, b64, mime) {
  var resultado = subirUnaFoto(orm, tipo, nombre, b64, mime);
  if (resultado.url) FOTO_URLS_CACHE[orm + '_' + nombre] = resultado.url;
  return resultado;
}

function getFotoUrl(orm, nombre) {
  var url = FOTO_URLS_CACHE[orm + '_' + nombre] || '';
  return {url: url};
}

// ── Guardar registro ──
function guardarRegistro(registro) {
  try {
    Logger.log('guardarRegistro tipo: ' + registro.tipo);
    var ss = getSheet();

    if (registro.tipo === 'inspeccion') {
      var sheetInsp = ss.getSheetByName('Inspecciones');
      if (!sheetInsp) {
        sheetInsp = ss.insertSheet('Inspecciones');
        sheetInsp.appendRow(['Codigo ORM','Suministro','Distrito','Petitorio','Motivo',
          'Inspector','Fecha Insp','Hora Insp','Fecha Reporte','LCL','Cod Apoyo',
          'Coordenadas','Inclinado','Angulo','Cumple DMS','Acceso Grua','Acometidas',
          'DHLP','DHLC','DVLP','Detalle Trabajos','Foto Perfil','Foto Vista',
          'Foto Panoramica','Foto Deficiencia','Foto Insp1','Foto Insp2',
          'Croquis','Conformidad','Estado','Fecha Registro']);
        sheetInsp.setFrozenRows(1);
        sheetInsp.getRange(1,1,1,31).setBackground('#E8600A').setFontColor('white').setFontWeight('bold');
      }
      var d = registro.data;
      sheetInsp.appendRow([
        d.code||'', d.suministro||'', d.distrito||'', d.petitorio||'', d.motivo||'',
        d.inspector||'', d.fecha||'', d.hora||'', d.fechaRep||'',
        d.lcl||'', d.apoyo||'', d.coords||'', d.incl||'', d.angulo||'',
        d.dms||'', d.grua||'', d.acm||'',
        d.dhlp||'', d.dhlc||'', d.dvlp||'', d.det||'',
        d.fotos ? (d.fotos['Foto_Perfil']||'') : '',
        d.fotos ? (d.fotos['Foto_Vista_defrente']||'') : '',
        d.fotos ? (d.fotos['Foto_Panoramica']||'') : '',
        d.fotos ? (d.fotos['Foto_deficiencia']||'') : '',
        d.fotos ? (d.fotos['Foto_Insp1']||'') : '',
        d.fotos ? (d.fotos['Foto_Insp2']||'') : '',
        d.fotos ? (d.fotos['Croquis']||'') : '',
        d.fotos ? (d.fotos['Conformidad_cliente']||'') : '',
        'Inspeccionado', new Date()
      ]);
      Logger.log('Inspección guardada: ' + d.code);
    }

    if (registro.tipo === 'ejecucion') {
      var sheetEjec = ss.getSheetByName('Ejecuciones');
      if (!sheetEjec) {
        sheetEjec = ss.insertSheet('Ejecuciones');
        sheetEjec.appendRow(['Codigo ORM','Tecnico','Fecha Ejec','Fecha Reporte',
          'Tipo Poste BT','Detalle Ejecutado','Foto Despues 1','Foto Despues 2',
          'Foto Despues 3','Foto Despues 4','Estado','Fecha Registro']);
        sheetEjec.setFrozenRows(1);
        sheetEjec.getRange(1,1,1,12).setBackground('#1A7A4A').setFontColor('white').setFontWeight('bold');
      }
      var e2 = registro.data;
      sheetEjec.appendRow([
        e2.code||'', e2.tecnico||'', e2.fecha||'', e2.fechaRep||'',
        e2.tipo||'', e2.det||'',
        e2.fotos ? (e2.fotos['Foto_despues1']||'') : '',
        e2.fotos ? (e2.fotos['Foto_despues2']||'') : '',
        e2.fotos ? (e2.fotos['Foto_despues3']||'') : '',
        e2.fotos ? (e2.fotos['Foto_despues4']||'') : '',
        'Ejecutado', new Date()
      ]);
      Logger.log('Ejecución guardada: ' + e2.code);
    }

    return {ok: true};
  } catch(e) {
    Logger.log('guardarRegistro error: ' + e.toString());
    return {error: e.toString()};
  }
}

// ── Leer registros ──
function getRegistrosPlus() {
  try {
    var ss = getSheet();
    var result = {inspecciones: [], ejecuciones: []};

    var sheetInsp = ss.getSheetByName('Inspecciones');
    if (sheetInsp && sheetInsp.getLastRow() > 1) {
      var hi = sheetInsp.getRange(1,1,1,31).getValues()[0];
      var di = sheetInsp.getRange(2,1,sheetInsp.getLastRow()-1,31).getValues();
      di.forEach(function(row) {
        if (!row[0]) return;
        var obj = {};
        hi.forEach(function(h,i) { obj[h] = String(row[i]||''); });
        result.inspecciones.push(obj);
      });
    }

    var sheetEjec = ss.getSheetByName('Ejecuciones');
    if (sheetEjec && sheetEjec.getLastRow() > 1) {
      var he = sheetEjec.getRange(1,1,1,12).getValues()[0];
      var de = sheetEjec.getRange(2,1,sheetEjec.getLastRow()-1,12).getValues();
      de.forEach(function(row) {
        if (!row[0]) return;
        var obj = {};
        he.forEach(function(h,i) { obj[h] = String(row[i]||''); });
        result.ejecuciones.push(obj);
      });
    }

    return JSON.stringify(result);
  } catch(e) {
    return JSON.stringify({error: e.toString()});
  }
}

// ── Eliminar registro ──
function eliminarRegistro(codigoORM) {
  try {
    var ss = getSheet();
    ['Inspecciones','Ejecuciones'].forEach(function(nombre) {
      var sheet = ss.getSheetByName(nombre);
      if (!sheet || sheet.getLastRow() < 2) return;
      var data = sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues();
      for (var i = data.length-1; i >= 0; i--) {
        if (String(data[i][0]).trim() === String(codigoORM)) sheet.deleteRow(i+2);
      }
    });
    return {ok: true};
  } catch(e) {
    return {error: e.toString()};
  }
}

// ── Obtener inspección por ORM ──
function getInspeccionPorORM(codigoORM) {
  try {
    var ss = getSheet();
    var sheetInsp = ss.getSheetByName('Inspecciones');
    if (!sheetInsp || sheetInsp.getLastRow() < 2) return JSON.stringify({inspeccion: null});
    var headers = sheetInsp.getRange(1,1,1,31).getValues()[0];
    var data = sheetInsp.getRange(2,1,sheetInsp.getLastRow()-1,31).getValues();
    var found = null;
    data.forEach(function(row) {
      if (!row[0]) return;
      var obj = {};
      headers.forEach(function(h,i) { obj[h] = String(row[i]||''); });
      if (obj['Codigo ORM'] === String(codigoORM)) found = obj;
    });
    return JSON.stringify({inspeccion: found});
  } catch(e) {
    return JSON.stringify({error: e.toString()});
  }
}

// ── Test de conexión ──
function testConexion() {
  Logger.log('=== TEST CONEXIÓN ===');
  var ss = getSheet();
  Logger.log('Sheet OK: ' + ss.getName() + ' ID: ' + ss.getId());
  var testB64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';
  var r = subirUnaFoto('TEST_CONEXION', 'Test', 'test_foto', testB64, 'image/jpeg');
  Logger.log('subirFoto: ' + JSON.stringify(r));
  var r2 = guardarRegistro({tipo:'inspeccion', data:{code:'TEST_CONEXION', suministro:'0', distrito:'TEST', petitorio:'TEST', motivo:'TEST', inspector:'TEST', fecha:'2026-06-16', hora:'00:00', fechaRep:'2026-06-16', lcl:'', apoyo:'', coords:'', incl:'N', angulo:'', dms:'N', grua:'Si', acm:'0', dhlp:'', dhlc:'', dvlp:'', det:'TEST DE CONEXION', fotos:{}}});
  Logger.log('guardarRegistro: ' + JSON.stringify(r2));
}

// ── Sistema de chunks para fotos grandes ──
var CHUNKS_CACHE = {};

function recibirChunkFoto(orm, nombre, mime, idx, total, chunk) {
  try {
    var key = orm + '||' + nombre;
    if (!CHUNKS_CACHE[key]) {
      CHUNKS_CACHE[key] = { chunks: new Array(total), mime: mime, total: total };
    }
    CHUNKS_CACHE[key].chunks[idx] = chunk;
    Logger.log('Chunk ' + (idx+1) + '/' + total + ' recibido para ' + key);
    return { ok: true, idx: idx, total: total };
  } catch(e) {
    return { error: e.toString() };
  }
}

function ensamblarYSubirFoto(orm, nombre, mime, total) {
  try {
    var key = orm + '||' + nombre;
    var cached = CHUNKS_CACHE[key];
    if (!cached) return { error: 'No hay chunks para ' + key };

    var missing = [];
    for (var i = 0; i < total; i++) {
      if (!cached.chunks[i]) missing.push(i);
    }
    if (missing.length > 0) return { error: 'Faltan chunks: ' + missing.join(',') };

    var b64completo = cached.chunks.join('');
    Logger.log('Ensamblando ' + nombre + ': ' + b64completo.length + ' chars');

    delete CHUNKS_CACHE[key];

    return subirUnaFotoYCachear(orm, 'Inspeccion', nombre, b64completo, mime || cached.mime);
  } catch(e) {
    Logger.log('ensamblarFoto error: ' + e.toString());
    return { error: e.toString() };
  }
}

function getCarpetaId(orm, tipo) {
  try {
    var rootName = 'ORM Cobra - Inspecciones';
    var rootFolders = DriveApp.getFoldersByName(rootName);
    var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(rootName);

    var ormFolders = rootFolder.getFoldersByName(orm);
    var ormFolder = ormFolders.hasNext() ? ormFolders.next() : rootFolder.createFolder(orm);

    var tipoStr = tipo || 'Inspeccion';
    var tipoFolders = ormFolder.getFoldersByName(tipoStr);
    var tipoFolder = tipoFolders.hasNext() ? tipoFolders.next() : ormFolder.createFolder(tipoStr);

    return { ok: true, folderId: tipoFolder.getId() };
  } catch(e) {
    return { error: e.toString() };
  }
}

// ── Editar detalle de trabajos de una inspección ──
function editarDetalle(codigoORM, nuevoDetalle) {
  try {
    var ss = getSheet();
    var sheetInsp = ss.getSheetByName('Inspecciones');
    if (!sheetInsp || sheetInsp.getLastRow() < 2) return {error: 'Sin datos'};

    var data = sheetInsp.getRange(2, 1, sheetInsp.getLastRow()-1, 1).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(codigoORM)) {
        sheetInsp.getRange(i+2, 21).setValue(nuevoDetalle);
        Logger.log('Detalle actualizado para ORM: ' + codigoORM);
        return {ok: true};
      }
    }
    return {error: 'ORM no encontrada: ' + codigoORM};
  } catch(e) {
    Logger.log('editarDetalle error: ' + e.toString());
    return {error: e.toString()};
  }
}

// ── buscarPoste: lookup puntual por número de poste ──────────────
// Devuelve hasta 8 coincidencias. Busca por prefijo (ej: "2252" encuentra "225208").
function buscarPosteHandler(q) {
  q = String(q || '').trim();
  if (q.length < 2) return { results: [] };

  try {
    var ss    = SpreadsheetApp.openById('1soodRPLeyh__Oa-D8OGfVk1MEEzgOD2FdqzUKgqF-BI');
    var sheet = ss.getSheetByName('POSTES');
    if (!sheet) return { error: 'Hoja POSTES no encontrada', results: [] };

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { results: [] };

    var data    = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
    var results = [];

    for (var i = 0; i < data.length && results.length < 8; i++) {
      var poste = String(data[i][0]).trim();
      if (!poste || !poste.startsWith(q)) continue;

      var rawCoords = String(data[i][2]).trim().replace(/º/g, '').replace(/\s+/g, '');
      if (!rawCoords) continue;

      results.push({ poste: poste, coords: rawCoords.replace(',', ', ') });
    }

    return { results: results };

  } catch(e) {
    Logger.log('buscarPosteHandler error: ' + e.toString());
    return { error: e.toString(), results: [] };
  }
}

// ════════════════════════════════════════════════════════════════════
// MÓDULO TRABAJOS — importación, gestión y actualización ODM
// Compatibilidad futura: Mapa Operativo
// ════════════════════════════════════════════════════════════════════

var TRABAJOS_HEADERS = [
  'ID_TRABAJO','IDENTIFICADOR','TIPO_TRABAJO','SUBTIPO','POSTE',
  'OT','COORD_PROGRAMADA','ESTADO_COORD','DISTRITO','SED','EECC',
  'ESTADO','PRIORIDAD','ODM','ODM_FECHA','ODM_ESTADO',
  'FECHA_IMPORTACION','JSON_EXTRA'
];

// ── 1: Obtener lista completa de trabajos ─────────────────────────
function obtenerTrabajosHandler_(e) {
  try {
    var ss = getSheet();
    var sh = ss.getSheetByName('TRABAJOS');
    if (!sh || sh.getLastRow() < 2) return { trabajos: [] };
    var ncols   = sh.getLastColumn();
    var headers = sh.getRange(1, 1, 1, ncols).getValues()[0];
    var data    = sh.getRange(2, 1, sh.getLastRow() - 1, ncols).getValues();
    var trabajos = [];
    data.forEach(function(row) {
      if (!row[0]) return;
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = String(row[i] || ''); });
      trabajos.push(obj);
    });
    return { trabajos: trabajos };
  } catch(err) {
    Logger.log('obtenerTrabajosHandler_ error: ' + err.toString());
    return { error: err.toString() };
  }
}

// ── 2: Preview de importación sin guardar ────────────────────────
function previewTrabajosHandler_(param) {
  try {
    var tipo          = String(param.tipo          || '');
    var archivoOrigen = String(param.archivoOrigen || '');
    var rows          = JSON.parse(param.data      || '[]');
    var mapped        = mapearColumnasTrabajos_(rows, tipo, archivoOrigen);
    return { preview: mapped.slice(0, 20), total: mapped.length };
  } catch(err) {
    Logger.log('previewTrabajosHandler_ error: ' + err.toString());
    return { error: err.toString() };
  }
}

// ── 3: Importar trabajos a hoja TRABAJOS ─────────────────────────
function aplicarTrabajosHandler_(param) {
  try {
    var tipo          = String(param.tipo          || '');
    var archivoOrigen = String(param.archivoOrigen || '');
    var rows          = JSON.parse(param.data      || '[]');
    var mapped        = mapearColumnasTrabajos_(rows, tipo, archivoOrigen);

    // Normalizar tipo a singular
    var tipoNorm = tipo
      .replace(/REUBICACIONES$/i, 'REUBICACION')
      .replace(/PROTECCIONES$/i,  'PROTECCION')
      .replace(/RETENIDAS$/i,     'RETENIDA');
    var tiposValidos = ['ORM','RETENIDA','PROTECCION','REUBICACION'];
    if (tiposValidos.indexOf(tipoNorm) === -1) tipoNorm = tipo;

    var ss = getSheet();
    var sh = ss.getSheetByName('TRABAJOS');
    if (!sh) {
      sh = ss.insertSheet('TRABAJOS');
      sh.appendRow(TRABAJOS_HEADERS);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, TRABAJOS_HEADERS.length)
        .setBackground('#1A4A8A').setFontColor('white').setFontWeight('bold');
    }

    // Deduplicar por IDENTIFICADOR (col B)
    var existentes = {};
    if (sh.getLastRow() > 1) {
      sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues().forEach(function(r) {
        if (r[0]) existentes[String(r[0]).trim()] = true;
      });
    }

    var nuevos = 0, duplicados = 0;
    var hoy = Utilities.formatDate(new Date(), 'America/Lima', 'yyyyMMdd');

    mapped.forEach(function(m) {
      var ident = String(m.IDENTIFICADOR || '').trim();
      if (!ident) return;
      if (existentes[ident]) { duplicados++; return; }

      var seq       = ('0000' + sh.getLastRow()).slice(-4);
      var idTrabajo = 'IT-' + hoy + '-' + seq;

      sh.appendRow([
        idTrabajo,                          // A  ID_TRABAJO
        ident,                              // B  IDENTIFICADOR
        tipoNorm,                           // C  TIPO_TRABAJO
        m.SUBTIPO          || '',           // D  SUBTIPO
        m.POSTE            || '',           // E  POSTE
        '',                                 // F  OT (vacío)
        m.COORD_PROGRAMADA || '',           // G  COORD_PROGRAMADA
        m.ESTADO_COORD     || 'SIN_COORD', // H  ESTADO_COORD
        m.DISTRITO         || '',           // I  DISTRITO
        m.SED              || '',           // J  SED
        m.EECC             || '',           // K  EECC
        'PENDIENTE_INSPECCION',             // L  ESTADO inicial
        m.PRIORIDAD        || '',           // M  PRIORIDAD
        '',                                 // N  ODM (vacío)
        '',                                 // O  ODM_FECHA (vacío)
        '',                                 // P  ODM_ESTADO (vacío)
        new Date(),                         // Q  FECHA_IMPORTACION
        m.JSON_EXTRA       || '{}'          // R  JSON_EXTRA
      ]);
      existentes[ident] = true;
      nuevos++;
    });

    Logger.log('Import TRABAJOS [' + tipoNorm + ']: nuevos=' + nuevos + ' dup=' + duplicados);
    return { ok: true, nuevos: nuevos, duplicados: duplicados };
  } catch(err) {
    Logger.log('aplicarTrabajosHandler_ error: ' + err.toString());
    return { error: err.toString() };
  }
}

// ── 4: Actualizar OT / ODM de un trabajo ─────────────────────────
function actualizarOdmHandler_(e) {
  try {
    var idTrabajo = String(e.parameter.idTrabajo  || '').trim();
    var ot        = String(e.parameter.ot         || '').trim();
    var odm       = String(e.parameter.odm        || '').trim();
    var odmFecha  = String(e.parameter.odmFecha   || '').trim();
    var odmEstado = String(e.parameter.odmEstado  || '').trim();

    // Guard ORM: solo registros IT-
    if (!idTrabajo || idTrabajo.indexOf('IT-') !== 0) {
      return { error: 'idTrabajo inválido: ' + idTrabajo };
    }

    var ss = getSheet();
    var sh = ss.getSheetByName('TRABAJOS');
    if (!sh || sh.getLastRow() < 2) return { error: 'Hoja TRABAJOS vacía' };

    var ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() !== idTrabajo) continue;
      var fila = i + 2;
      if (ot)        sh.getRange(fila,  6).setValue(ot);        // F: OT
      if (odm)       sh.getRange(fila, 14).setValue(odm);       // N: ODM
      if (odmFecha)  sh.getRange(fila, 15).setValue(odmFecha);  // O: ODM_FECHA
      if (odmEstado) sh.getRange(fila, 16).setValue(odmEstado); // P: ODM_ESTADO
      sh.getRange(fila, 12).setValue('ASIGNADO');               // L: ESTADO
      Logger.log('actualizarODM OK: ' + idTrabajo + ' OT=' + ot);
      return { ok: true };
    }
    return { error: 'ID no encontrado: ' + idTrabajo };
  } catch(err) {
    Logger.log('actualizarOdmHandler_ error: ' + err.toString());
    return { error: err.toString() };
  }
}

// ── 5: Mapear columnas Excel según tipo de actividad ─────────────
function mapearColumnasTrabajos_(rows, tipo, archivoOrigen) {
  var esReubicacion = tipo.toUpperCase().indexOf('REUBICAC') !== -1;
  archivoOrigen = String(archivoOrigen || '');

  if (esReubicacion && rows.length > 0) {
    Logger.log('COLUMNAS=' + JSON.stringify(Object.keys(rows[0] || {})));
  }

  return rows.map(function(r) {
    var poste, distrito, sed, eecc, subtipo, prioridad,
        identificador, coordFinal, estadoCoord, jsonExtra, coordRaw;

    if (esReubicacion) {
      Logger.log('KEYS=' + JSON.stringify(Object.keys(r)));
      Logger.log('OT_RAW=' + r['Número de orden de trabajo']);
      Logger.log('OT_KEYS=' + Object.keys(r).join('|'));
      poste         = r['# POSTE']            || r['POSTE']    || '';
      distrito      = r['DISTRIRO']           || r['DISTRITO'] || ''; // typo en Excel original
      sed           = r['SED']                || '';
      eecc          = r['EECC']               || '';
      subtipo       = r['CLASIF DEFICIENCIA'] || r['CLASIF']   || '';
      prioridad     = r['PRIORIDAD']          || '';
      identificador = String(r['Número de orden de trabajo'] || '').trim();
      Logger.log('OT=' + String(r['Número de orden de trabajo'] || ''));

      var latDMS = String(r['LATITUD']  || r['LAT']  || '').trim();
      var lonDMS = String(r['LONGITUD'] || r['LON']  || '').trim();
      if (latDMS && lonDMS) {
        coordFinal  = dmsADecimal_(latDMS) + ',' + dmsADecimal_(lonDMS);
        estadoCoord = 'EXCEL';
      } else {
        coordFinal  = resolverCoordsPoste_(poste);
        estadoCoord = coordFinal ? 'POSTE' : 'SIN_COORD';
      }

      jsonExtra = JSON.stringify({
        Caso:           String(r['Caso: Número de caso']                              || ''),
        Estado_ORM:     String(r['Estado de ORM']                                     || ''),
        Tipo_Orden:     String(r['Tipo Orden']                                         || ''),
        Num_OT:         String(r['Número de orden de trabajo']                         || ''),
        Num_Suministro: String(r['Número Suministro']                                  || ''),
        Detalle_Cuenta: String(r['Detalles para Cuenta de Número de orden de trabajo'] || ''),
        fuente:         'EXCEL',
        archivo_origen: archivoOrigen
      });

    } else {
      // RETENIDA y PROTECCION
      poste         = r['CODIGO DE POSTE']    || r['POSTE']    || '';
      distrito      = r['DISTRITO']           || '';
      sed           = r['SED']                || '';
      eecc          = r['EECC']               || '';
      subtipo       = r['CLASIF DEFICIENCIA'] || r['CLASIF']   || '';
      prioridad     = r['PRIORIDAD']          || '';
      identificador = r['IDENTIFICADOR'] || r['ID'] || r['CODIGO DE POSTE'] || '';

      coordRaw = limpiarCoordDecimal_(r['REFERENCIA DE UBICACIÓN'] || r['COORDENADAS'] || '');
      if (coordRaw) {
        coordFinal  = coordRaw;
        estadoCoord = 'EXCEL';
      } else {
        coordFinal  = resolverCoordsPoste_(poste);
        estadoCoord = coordFinal ? 'POSTE' : 'SIN_COORD';
      }

      jsonExtra = JSON.stringify({
        fuente:         'EXCEL',
        archivo_origen: archivoOrigen
      });
    }

    return {
      IDENTIFICADOR:    String(identificador).trim(),
      SUBTIPO:          String(subtipo).trim(),
      POSTE:            String(poste).trim(),
      COORD_PROGRAMADA: String(coordFinal).trim(),
      ESTADO_COORD:     estadoCoord,
      DISTRITO:         String(distrito).trim(),
      SED:              String(sed).trim(),
      EECC:             String(eecc).trim(),
      PRIORIDAD:        String(prioridad).trim(),
      JSON_EXTRA:       jsonExtra
    };
  }).filter(function(r) { return String(r.IDENTIFICADOR || '').trim() !== ''; });
}

// ── 6: Limpiar coord decimal (quitar comillas envolventes) ────────
function limpiarCoordDecimal_(val) {
  return String(val || '').trim().replace(/^["']|["']$/g, '');
}

// ── 7: DMS → decimal ─────────────────────────────────────────────
function dmsADecimal_(dms) {
  dms = String(dms || '').trim();
  if (/^-?\d+(\.\d+)?$/.test(dms)) return parseFloat(dms);
  var m = dms.match(/(\d+)[°º]\s*(\d+)['''`]\s*([\d.]+)["""]\s*([NSEWnsew])?/);
  if (!m) { Logger.log('dmsADecimal_ no parseable: ' + dms); return 0; }
  var dec = parseFloat(m[1]) + parseFloat(m[2]) / 60 + parseFloat(m[3]) / 3600;
  if (('SW').indexOf((m[4] || '').toUpperCase()) !== -1) dec = -dec;
  return Math.round(dec * 1000000) / 1000000;
}

// ── 8: Buscar coordenadas de un poste en BD POSTES ───────────────
function resolverCoordsPoste_(poste) {
  try {
    poste = String(poste || '').trim();
    if (!poste) return '';
    var ss    = SpreadsheetApp.openById('1soodRPLeyh__Oa-D8OGfVk1MEEzgOD2FdqzUKgqF-BI');
    var sheet = ss.getSheetByName('POSTES');
    if (!sheet || sheet.getLastRow() < 2) return '';
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() !== poste) continue;
      var raw = String(data[i][2]).trim().replace(/º/g, '').replace(/\s+/g, '');
      return raw || '';
    }
    return '';
  } catch(err) {
    Logger.log('resolverCoordsPoste_ error: ' + err.toString());
    return '';
  }
}
