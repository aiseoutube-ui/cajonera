
/**
 * LA CAJONERA - BACKEND (Google Apps Script)
 * ID DEL SPREADSHEET: 1jGkT2i8BYDeiRi61DcD2vBQX9He9pcZaQ_2k72wO1dc
 */

const SPREADSHEET_ID = '1jGkT2i8BYDeiRi61DcD2vBQX9He9pcZaQ_2k72wO1dc'.trim(); 

function getSs() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/**
 * Función de inicialización para crear las hojas necesarias si no existen.
 */
function setup() {
  const ss = getSs();
  const sheets = ['PRODUCTOS', 'PEDIDOS', 'REGISTROS', 'CONFIG'];
  sheets.forEach(name => {
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  });
  
  // Setup Config por defecto
  const configSheet = ss.getSheetByName('CONFIG');
  if (configSheet.getLastRow() === 0) {
    configSheet.appendRow(['LLAVE', 'VALOR']);
    configSheet.appendRow(['ESTADO_CAJONERA', 'ABIERTO']); // ABIERTO o CERRADO
  }
}

function doGet(e) {
  try {
    const ss = getSs();
    
    // 1. Verificar Estado de la Cajonera
    const configSheet = ss.getSheetByName('CONFIG');
    const configData = configSheet.getDataRange().getValues();
    let estado = "CERRADO";
    configData.forEach(row => {
      if (row[0] === 'ESTADO_CAJONERA') estado = row[1];
    });

    // 2. Obtener Productos
    const sheet = ss.getSheetByName('PRODUCTOS');
    const data = sheet.getDataRange().getValues();
    
    const rawHeaders = data.shift() || [];
    const headers = rawHeaders.map(h => h.toString().toLowerCase().trim().replace(/\s+/g, '_'));
    
    const products = data.map((row, index) => {
      let obj = {};
      headers.forEach((header, i) => obj[header] = row[i]);
      if (!obj.id) obj.id = "idx-" + index;
      return obj;
    }).filter(p => p.estado && p.estado.toString().toUpperCase().trim() === 'ACTIVO');

    return createJsonResponse({ 
      estado: estado, 
      products: products 
    });
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
    
    // ACCIÓN: REGISTRO DE ENTRADA (S/ 2.00)
    if (params.action === 'REGISTER_ENTRY') {
      const sheetRegistros = ss.getSheetByName('REGISTROS');
      sheetRegistros.appendRow([
        new Date(), 
        params.userName, 
        params.userPhone, 
        'PAGO_PENDIENTE_CONFIRMAR', 
        'S/ 2.00'
      ]);
      return createJsonResponse({ status: 'success', message: 'Registro guardado' });
    }

    // ACCIÓN: PEDIDO DE PRODUCTOS
    const sheetPedidos = ss.getSheetByName('PEDIDOS');
    const sheetProductos = ss.getSheetByName('PRODUCTOS');
    
    const pedidoId = 'PED-' + new Date().getTime();
    sheetPedidos.appendRow([
      pedidoId, 
      new Date(), 
      params.userName, 
      JSON.stringify(params.cart), 
      params.total, 
      'MANUAL EN WHATSAPP', 
      'ESPERANDO VOUCHER'
    ]);

    // Actualizar Stock
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

    return createJsonResponse({ status: 'success', pedidoId: pedidoId });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
