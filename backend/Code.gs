
/**
 * LA CAJONERA - BACKEND (Google Apps Script)
 * ID DEL SPREADSHEET: 1jGkT2i8BYDeiRi61DcD2vBQX9He9pcZaQ_2k72wO1dc
 */

const SPREADSHEET_ID = '1jGkT2i8BYDeiRi61DcD2vBQX9He9pcZaQ_2k72wO1dc'.trim(); 
const FOLDER_ID = ''; // Si se deja vacío, se guardará en la raíz de tu Drive

/**
 * PASO CRÍTICO:
 * Cada vez que pegues este código nuevo:
 * 1. Ejecuta la función 'setup' manualmente.
 * 2. Implementar > Nueva implementación > Aplicación Web.
 * 3. Copia la NUEVA URL y pégala en constants.tsx.
 */

function getSs() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    console.error("Error al abrir SS: " + e.message);
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

function setup() {
  const ss = getSs();
  
  let sheetProd = ss.getSheetByName('PRODUCTOS');
  if (!sheetProd) {
    sheetProd = ss.insertSheet('PRODUCTOS');
    sheetProd.appendRow(['id', 'nombre', 'descripcion', 'precio', 'imagen_url', 'meta_stock', 'vendidos_actual', 'estado']);
    sheetProd.appendRow(['1', 'Producto Ejemplo', 'Descripción', 10.00, 'https://picsum.photos/400', 100, 0, 'ACTIVO']);
  }
  
  let sheetPed = ss.getSheetByName('PEDIDOS');
  if (!sheetPed) {
    sheetPed = ss.insertSheet('PEDIDOS');
    sheetPed.appendRow(['id_pedido', 'fecha', 'cliente_nombre', 'json_detalle', 'total_pagado', 'url_voucher_drive', 'estado_pedido']);
  }
  
  console.log("Configuración OK");
  return "App configurada correctamente";
}

function doGet(e) {
  try {
    const ss = getSs();
    const sheet = ss.getSheetByName('PRODUCTOS');
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createJsonResponse([]);
    
    const rawHeaders = data.shift();
    const headers = rawHeaders.map(h => h.toString().toLowerCase().trim().replace(/\s+/g, '_'));
    
    const products = data.map((row, index) => {
      let obj = {};
      headers.forEach((header, i) => obj[header] = row[i]);
      if (!obj.id) obj.id = "idx-" + index;
      return obj;
    }).filter(p => p.estado && p.estado.toString().toUpperCase().trim() === 'ACTIVO');

    return createJsonResponse(products);
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const params = JSON.parse(e.postData.contents);
    const ss = getSs();
    const sheetPedidos = ss.getSheetByName('PEDIDOS');
    const sheetProductos = ss.getSheetByName('PRODUCTOS');
    
    // 1. Procesar Imagen de Voucher
    let imageUrl = 'no-image';
    if (params.voucherBase64) {
      imageUrl = uploadToDrive(params.voucherBase64, params.userName);
    }

    // 2. Guardar Pedido
    const pedidoId = 'PED-' + new Date().getTime();
    sheetPedidos.appendRow([
      pedidoId, 
      new Date(), 
      params.userName, 
      JSON.stringify(params.cart), 
      params.total, 
      imageUrl, 
      'PENDIENTE'
    ]);

    // 3. Actualizar Stock
    const productosData = sheetProductos.getDataRange().getValues();
    const headers = productosData[0].map(h => h.toString().toLowerCase().trim().replace(/\s+/g, '_'));
    const idxVendidos = headers.indexOf('vendidos_actual');
    const idxId = headers.indexOf('id');

    params.cart.forEach(item => {
      for (let i = 1; i < productosData.length; i++) {
        if (productosData[i][idxId].toString() == item.id.toString()) {
          const val = parseInt(productosData[i][idxVendidos]) || 0;
          sheetProductos.getRange(i + 1, idxVendidos + 1).setValue(val + item.quantity);
          break;
        }
      }
    });

    return createJsonResponse({ status: 'success', pedidoId: pedidoId, imageUrl: imageUrl });
  } catch (error) {
    console.error(error);
    return createJsonResponse({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function uploadToDrive(base64Data, userName) {
  try {
    let folder;
    if (FOLDER_ID && FOLDER_ID.trim().length > 5) {
      folder = DriveApp.getFolderById(FOLDER_ID.trim());
    } else {
      // Si no hay carpeta, intentar guardar en la raíz
      folder = DriveApp.getRootFolder();
    }

    const contentType = base64Data.substring(5, base64Data.indexOf(';'));
    const bytes = Utilities.base64Decode(base64Data.split(',')[1]);
    const blob = Utilities.newBlob(bytes, contentType, `Voucher_${userName}_${Date.now()}.jpg`);
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (e) {
    console.error("Error en uploadToDrive: " + e.message);
    return "error-upload: " + e.message;
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
