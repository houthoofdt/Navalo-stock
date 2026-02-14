/**
 * NAVALO Stock PAC - Google Apps Script Backend v4
 * With FIFO, CNB Exchange Rates, Stock Valuation, Purchase Orders, TH11
 * 
 * INSTALLATION:
 * 1. Créez un nouveau Google Sheet
 * 2. Extensions → Apps Script
 * 3. Collez ce code dans Code.gs
 * 4. Exécutez initializeSpreadsheet() une fois
 * 5. Exécutez importBomData() pour importer les BOM
 * 6. Déployer → Nouveau déploiement → Application Web
 */

// ========================================
// CONFIGURATION
// ========================================

const SHEET_NAMES = {
  STOCK: 'Stock',
  STOCK_LOTS: 'Stock_Lots',
  BOM_TX9: 'BOM_TX9',
  BOM_TX12_3PH: 'BOM_TX12-3PH',
  BOM_TX12_1PH: 'BOM_TX12-1PH',
  BOM_TH11: 'BOM_TH11',  // NEW: TH11 model
  HISTORY: 'Historique',
  RECEIPTS: 'Prijemky',  // NEW: Receipts/Příjemky
  DELIVERIES: 'Livraisons',
  PURCHASE_ORDERS: 'Commandes',
  RECEIVED_ORDERS: 'Commandes_Recues',  // NEW: Received orders from clients
  INVOICES: 'Factures',  // NEW: Invoices
  RECEIVED_INVOICES: 'Factures_Recues',  // NEW: Supplier invoices
  PAC_STOCK: 'PAC_Stock',
  CONFIG: 'Config',
  CONTACTS: 'Contacts',  // NEW: Suppliers & Clients
  COMPONENT_PRICES: 'Prix_Composants',  // NEW: Component prices
  EXCHANGE_RATES: 'Taux_Change'
};

// PAC Models configuration
const PAC_MODELS = ['TX9', 'TX12-3PH', 'TX12-1PH', 'TH11'];

// CNB Exchange Rate API
const CNB_URL = 'https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt';

// ========================================
// WEB APP ENDPOINTS
// ========================================

function doGet(e) {
  const action = e.parameter.action;
  let result;
  
  try {
    switch(action) {
      case 'getStock':
        result = getStock();
        break;
      case 'getStockWithValue':
        result = getStockWithValue();
        break;
      case 'getBom':
        result = getAllBom();
        break;
      case 'getHistory':
        result = getHistory(e.parameter.limit || 100);
        break;
      case 'getDeliveries':
        result = getDeliveries(e.parameter.limit || 50);
        break;
      case 'getReceipts':
        result = getReceipts(e.parameter.limit || 50);
        break;
      case 'getPurchaseOrders':
        result = getPurchaseOrders(e.parameter.limit || 50);
        break;
      case 'getReceivedOrders':
        result = getReceivedOrders(e.parameter.limit || 50);
        break;
      case 'getInvoices':
        result = getInvoices(e.parameter.limit || 50);
        break;
      case 'getReceivedInvoices':
        result = getReceivedInvoices(e.parameter.limit || 50);
        break;
      case 'getPacStock':
        result = getPacStock();
        break;
      case 'getExchangeRate':
        result = getExchangeRate(e.parameter.currency || 'EUR');
        break;
      case 'getExchangeRateForDate':
        result = getExchangeRateForDate(e.parameter.currency || 'EUR', e.parameter.date);
        break;
      case 'getStockValuation':
        result = getStockValuation();
        break;
      case 'getSuggestedOrders':
        result = getSuggestedOrders();
        break;
      case 'getContacts':
        result = getContacts(e.parameter.type);
        break;
      case 'getComponentPrices':
        result = getComponentPrices();
        break;
      case 'getConfig':
        result = getConfig();
        break;
      case 'getQuotes':
        result = getQuotes(e.parameter.limit || 50);
        break;
      default:
        result = { error: 'Action non reconnue: ' + action };
    }
  } catch(error) {
    result = { error: error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let data;
  
  // Handle different content types
  try {
    if (e.postData.type === 'application/x-www-form-urlencoded' || 
        e.postData.type === 'multipart/form-data') {
      // FormData format
      const payload = e.parameter.payload || e.postData.contents;
      data = JSON.parse(payload);
    } else {
      // JSON format
      data = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    // Try to parse as URL params
    if (e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ 
        error: 'Invalid request format: ' + err.toString() 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  const action = data.action;
  let result;
  
  try {
    switch(action) {
      case 'processReceipt':
        result = processReceipt(data);
        break;
      case 'processDelivery':
        result = processDelivery(data);
        break;
      case 'deleteDelivery':
        result = deleteDelivery(data.id);
        break;
      case 'createPurchaseOrder':
        result = createPurchaseOrder(data);
        break;
      case 'updatePurchaseOrder':
        result = updatePurchaseOrder(data);
        break;
      case 'deletePurchaseOrder':
        result = deletePurchaseOrder(data.id);
        break;
      case 'createReceivedOrder':
        result = createReceivedOrder(data);
        break;
      case 'updateReceivedOrder':
        result = updateReceivedOrder(data);
        break;
      case 'deleteReceivedOrder':
        result = deleteReceivedOrder(data.id);
        break;
      case 'createInvoice':
        result = createInvoice(data);
        break;
      case 'createReceivedInvoice':
        result = createReceivedInvoice(data);
        break;
      case 'updateReceivedInvoice':
        result = updateReceivedInvoice(data);
        break;
      case 'deleteReceivedInvoice':
        result = deleteReceivedInvoice(data.id);
        break;
      case 'addComponent':
        result = addComponent(data.component);
        break;
      case 'updateComponentPrice':
        result = updateComponentPrice(data);
        break;
      case 'saveBom':
        result = saveBom(data);
        break;
      case 'saveContact':
        result = saveContact(data);
        break;
      case 'deleteContact':
        result = deleteContact(data);
        break;
      case 'updateConfig':
        result = updateConfig(data);
        break;
      case 'uploadToDrive':
        result = uploadToDrive(data);
        break;
      case 'getDriveFile':
        result = getDriveFile(data.fileId);
        break;
      case 'listDriveInvoices':
        result = listDriveInvoices();
        break;
        case 'createProformaInvoice':
          result = createProformaInvoice(data);
          break;
        case 'convertProformaToInvoice':
          result = convertProformaToInvoice(data);
          break;
        case 'createQuote':
          result = createQuote(data);
          break;
        case 'updateQuote':
          result = updateQuote(data);
          break;
        case 'convertQuoteToInvoice':
          result = convertQuoteToInvoice(data);
          break;
        case 'deleteQuote':
          result = deleteQuote(data.quoteId);
          break;  
      default:
        result = { error: 'Action non reconnue: ' + action };
    }
  } catch(error) {
    result = { error: error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// CNB EXCHANGE RATES
// ========================================

function fetchCNBRates() {
  try {
    const response = UrlFetchApp.fetch(CNB_URL);
    const text = response.getContentText();
    const lines = text.split('\n');
    
    const rates = {};
    for (let i = 2; i < lines.length; i++) {
      const parts = lines[i].split('|');
      if (parts.length >= 5) {
        const currency = parts[3];
        const amount = parseFloat(parts[2]);
        const rate = parseFloat(parts[4].replace(',', '.'));
        if (currency && rate) {
          rates[currency] = rate / amount;
        }
      }
    }
    
    // Cache the rates
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let rateSheet = ss.getSheetByName(SHEET_NAMES.EXCHANGE_RATES);
    if (!rateSheet) {
      rateSheet = ss.insertSheet(SHEET_NAMES.EXCHANGE_RATES);
    }
    
    rateSheet.clear();
    rateSheet.appendRow(['Devise', 'Taux (CZK)', 'Date MAJ']);
    Object.entries(rates).forEach(([currency, rate]) => {
      rateSheet.appendRow([currency, rate, new Date()]);
    });
    
    return rates;
  } catch (error) {
    Logger.log('Error fetching CNB rates: ' + error);
    return null;
  }
}

function getExchangeRate(currency) {
  if (currency === 'CZK') return { currency: 'CZK', rate: 1 };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rateSheet = ss.getSheetByName(SHEET_NAMES.EXCHANGE_RATES);
  
  if (rateSheet && rateSheet.getLastRow() > 1) {
    const data = rateSheet.getDataRange().getValues();
    const lastUpdate = data[1][2];
    const today = new Date();
    
    if (lastUpdate && 
        lastUpdate.getDate() === today.getDate() &&
        lastUpdate.getMonth() === today.getMonth() &&
        lastUpdate.getFullYear() === today.getFullYear()) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === currency) {
          return { currency: currency, rate: data[i][1], cached: true };
        }
      }
    }
  }
  
  const rates = fetchCNBRates();
  if (rates && rates[currency]) {
    return { currency: currency, rate: rates[currency], cached: false };
  }
  
  return { currency: currency, rate: null, error: 'Taux non trouvé' };
}

/**
 * Fetch CNB exchange rate for a specific date
 * @param {string} currency - Currency code (e.g., 'EUR')
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {object} { currency, rate, date }
 */
function getExchangeRateForDate(currency, dateStr) {
  if (currency === 'CZK') return { currency: 'CZK', rate: 1, date: dateStr };

  try {
    // Parse date and format for CNB API (DD.MM.YYYY)
    const dateParts = dateStr.split('-');
    const cnbDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;

    // CNB historical rates URL
    const url = `https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt?date=${cnbDate}`;

    const response = UrlFetchApp.fetch(url);
    const text = response.getContentText();
    const lines = text.split('\n');

    for (let i = 2; i < lines.length; i++) {
      const parts = lines[i].split('|');
      if (parts.length >= 5 && parts[3] === currency) {
        const amount = parseFloat(parts[2]);
        const rate = parseFloat(parts[4].replace(',', '.'));
        return { currency: currency, rate: rate / amount, date: dateStr };
      }
    }

    return { currency: currency, rate: null, date: dateStr, error: 'Taux non trouvé pour cette date' };
  } catch (error) {
    Logger.log('Error fetching CNB rate for date: ' + error);
    return { currency: currency, rate: null, date: dateStr, error: error.toString() };
  }
}

// ========================================
// DOCUMENT NUMBERING
// ========================================

function getNextDocNumber(type) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const year = new Date().getFullYear();
  
  const prefixes = {
    'bl': 'BL',
    'po': 'OBJ',
    'ro': 'OP',
    'fv': 'FV',
    'fp': 'FP',
    'pr': 'PŘ',
    'pi': 'PI',
    'dev': 'DEV' 
  };
  
  const prefix = prefixes[type] || type.toUpperCase();
  const pattern = new RegExp(`^${prefix}${year}(\\d+)$`);
  
  // Find the sheet that contains this document type
  let sheetName;
  let numberColumn = 3; // Default column for document number
  
  switch(type) {
    case 'bl': sheetName = SHEET_NAMES.DELIVERIES; numberColumn = 3; break;
    case 'po': sheetName = SHEET_NAMES.PURCHASE_ORDERS; numberColumn = 3; break;
    case 'ro': sheetName = SHEET_NAMES.RECEIVED_ORDERS; numberColumn = 3; break;
    case 'fv': sheetName = SHEET_NAMES.INVOICES; numberColumn = 2; break;
    case 'fp': sheetName = SHEET_NAMES.RECEIVED_INVOICES; numberColumn = 2; break;
    case 'pr': sheetName = SHEET_NAMES.RECEIPTS; numberColumn = 3; break;
    case 'pi': sheetName = SHEET_NAMES.INVOICES; numberColumn = 2; break;
    case 'dev': sheetName = 'Devis'; numberColumn = 2; break;
    default: sheetName = null;
  }
  
  let maxNumber = 0;
  
  if (sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const docNum = String(data[i][numberColumn - 1] || '');
        const match = docNum.match(pattern);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }
  }
  
  // Also check config for any stored counter (fallback)
  const configSheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  const configData = configSheet.getDataRange().getValues();
  const configKey = `next_${type}_number_${year}`;
  
  for (let i = 1; i < configData.length; i++) {
    if (configData[i][0] === configKey) {
      const configNum = parseInt(configData[i][1], 10) || 1;
      if (configNum > maxNumber + 1) {
        maxNumber = configNum - 1;
      }
      break;
    }
  }
  
  const nextNum = maxNumber + 1;
  const docNumber = `${prefix}${year}${String(nextNum).padStart(3, '0')}`;
  
  // Update config with new counter
  let rowIndex = -1;
  for (let i = 1; i < configData.length; i++) {
    if (configData[i][0] === configKey) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex > 0) {
    configSheet.getRange(rowIndex, 2).setValue(nextNum + 1);
  } else {
    configSheet.appendRow([configKey, nextNum + 1]);
  }
  
  Logger.log('Generated doc number: ' + docNumber + ' (max found: ' + maxNumber + ')');
  
  return docNumber;
}

// ========================================
// INITIALIZATION
// ========================================

function initializeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create sheets if they don't exist
  Object.values(SHEET_NAMES).forEach(name => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });
  
  // Initialize Stock sheet
  const stockSheet = ss.getSheetByName(SHEET_NAMES.STOCK);
  if (stockSheet.getLastRow() === 0) {
    stockSheet.appendRow(['Référence', 'Désignation', 'Catégorie', 'Fabricant', 'Quantité', 'Stock Min', 'Valeur Stock (CZK)', 'Date MAJ']);
    stockSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  }
  
  // Initialize Stock Lots sheet (FIFO)
  const lotsSheet = ss.getSheetByName(SHEET_NAMES.STOCK_LOTS);
  if (lotsSheet.getLastRow() === 0) {
    lotsSheet.appendRow(['ID Lot', 'Référence', 'Date Entrée', 'N° Bon', 'Quantité Init', 'Quantité Rest', 'Prix Unit', 'Devise', 'Prix CZK', 'Fournisseur']);
    lotsSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#34a853').setFontColor('white');
  }
  
  // Initialize BOM sheets (including TH11)
  const bomSheets = [SHEET_NAMES.BOM_TX9, SHEET_NAMES.BOM_TX12_3PH, SHEET_NAMES.BOM_TX12_1PH, SHEET_NAMES.BOM_TH11];
  bomSheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Référence', 'Désignation', 'Catégorie', 'Quantité/PAC', 'Fabricant']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#34a853').setFontColor('white');
    }
  });
  
  // Initialize History sheet
  const historySheet = ss.getSheetByName(SHEET_NAMES.HISTORY);
  if (historySheet.getLastRow() === 0) {
    historySheet.appendRow(['Date', 'Type', 'N° Doc', 'Référence', 'Désignation', 'Quantité', 'Prix Unit CZK', 'Valeur CZK', 'Partenaire']);
    historySheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#fbbc04').setFontColor('black');
  }
  
  // Initialize Deliveries sheet
  const deliveriesSheet = ss.getSheetByName(SHEET_NAMES.DELIVERIES);
  if (deliveriesSheet.getLastRow() === 0) {
    deliveriesSheet.appendRow(['ID', 'Date', 'N° BL', 'Client', 'Adresse', 'TX9', 'TX12-3PH', 'TX12-1PH', 'TH11', 'Total', 'Valeur CZK', 'Statut', 'Notes']);
    deliveriesSheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#ea4335').setFontColor('white');
  }
  
  // Initialize Receipts (Prijemky) sheet
  const receiptsSheet = ss.getSheetByName(SHEET_NAMES.RECEIPTS);
  if (receiptsSheet.getLastRow() === 0) {
    receiptsSheet.appendRow(['ID', 'Date', 'N° Příjemky', 'Dodavatel', 'Nb Articles', 'Valeur', 'Devise', 'Obj. liée', 'Items JSON']);
    receiptsSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#4caf50').setFontColor('white');
  }
  
  // Initialize Purchase Orders sheet
  const poSheet = ss.getSheetByName(SHEET_NAMES.PURCHASE_ORDERS);
  if (poSheet.getLastRow() === 0) {
    poSheet.appendRow(['ID', 'Date', 'N° Commande', 'Fournisseur', 'Statut', 'Nb Articles', 'Valeur Estimée', 'Devise', 'Notes', 'Date Livraison', 'Items JSON']);
    poSheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#9c27b0').setFontColor('white');
  }
  
  // Initialize Received Orders sheet
  const roSheet = ss.getSheetByName(SHEET_NAMES.RECEIVED_ORDERS);
  if (roSheet.getLastRow() === 0) {
    roSheet.appendRow([
      'ID', 'Date', 'N° Commande', 'N° Cmd Client', 'Client', 'Adresse',
      'TX9 Qty', 'TX9 Prix', 'TX12-3PH Qty', 'TX12-3PH Prix', 
      'TX12-1PH Qty', 'TX12-1PH Prix', 'TH11 Qty', 'TH11 Prix',
      'Total', 'Devise', 'Date Livraison', 'Statut', 'Livré', 'Facturé', 'Notes'
    ]);
    roSheet.getRange(1, 1, 1, 21).setFontWeight('bold').setBackground('#00bcd4').setFontColor('white');
  }
  
  // Initialize Invoices sheet
  const invSheet = ss.getSheetByName(SHEET_NAMES.INVOICES);
  if (invSheet.getLastRow() === 0) {
    invSheet.appendRow(['ID', 'N° Facture', 'Date', 'Échéance', 'Client', 'HT', 'TVA', 'TTC', 'Devise', 'Payée', 'Date Paiement', 'BL Lié', 'Notes', 'Items JSON', 'Type']);
    invSheet.getRange(1, 1, 1, 15).setFontWeight('bold').setBackground('#ff9800').setFontColor('white');
  }
  
  // Ajouter colonne Type si elle manque sur une feuille existante
  if (invSheet.getLastRow() > 0 && invSheet.getLastColumn() < 15) {
    invSheet.getRange(1, 15).setValue('Type');
    invSheet.getRange(1, 15).setFontWeight('bold').setBackground('#ff9800').setFontColor('white');
  }
  
  // Initialize Received Invoices sheet
  const recInvSheet = ss.getSheetByName(SHEET_NAMES.RECEIVED_INVOICES);
  if (recInvSheet.getLastRow() === 0) {
    recInvSheet.appendRow(['ID', 'N° Interne', 'N° Facture', 'Date', 'Échéance', 'DUZP', 'Fournisseur', 'HT', 'TVA', 'TTC', 'Devise', 'Payée', 'Date Paiement', 'Příjemka', 'Notes']);
    recInvSheet.getRange(1, 1, 1, 15).setFontWeight('bold').setBackground('#795548').setFontColor('white');
  }
  // Initialize Devis sheet
let devisSheet = ss.getSheetByName('Devis');
if (!devisSheet) {
  devisSheet = ss.insertSheet('Devis');
}
if (devisSheet.getLastRow() === 0) {
  devisSheet.appendRow([
    'ID', 'N° Devis', 'Date', 'Validité', 'Client', 'Adresse',
    'HT', 'TVA', 'TTC', 'Devise', 'Statut', 'Converti', 'N° Facture',
    'Notes', 'Items JSON'
  ]);
  devisSheet.getRange(1, 1, 1, 15).setFontWeight('bold')
    .setBackground('#00897b').setFontColor('white');
}
  // Initialize PAC Stock sheet
  const pacStockSheet = ss.getSheetByName(SHEET_NAMES.PAC_STOCK);
  if (pacStockSheet.getLastRow() === 0) {
    pacStockSheet.appendRow(['Modèle', 'Quantité']);
    pacStockSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#9c27b0').setFontColor('white');
    PAC_MODELS.forEach(model => {
      pacStockSheet.appendRow([model, 0]);
    });
  }
  
  // Initialize Contacts sheet
  const contactsSheet = ss.getSheetByName(SHEET_NAMES.CONTACTS);
  if (contactsSheet.getLastRow() === 0) {
    contactsSheet.appendRow(['ID', 'Type', 'Nom', 'Adresse', 'ICO', 'DIC', 'Email', 'Téléphone', 'Devise Défaut', 'Notes']);
    contactsSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#607d8b').setFontColor('white');
    // Add default client
    contactsSheet.appendRow([Utilities.getUuid(), 'client', 'Alliance Laundry CE s.r.o.', 'Místecká 1116, 742 58 Příbor', '', '', '', '', 'EUR', '']);
  }
  
  // Initialize Component Prices sheet
  const pricesSheet = ss.getSheetByName(SHEET_NAMES.COMPONENT_PRICES);
  if (pricesSheet.getLastRow() === 0) {
    pricesSheet.appendRow(['Référence', 'Prix EUR', 'Prix CZK', 'Fournisseur Défaut', 'Date MAJ']);
    pricesSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#e91e63').setFontColor('white');
  }
  
  // Initialize Config sheet
  const configSheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (configSheet.getLastRow() === 0) {
    const year = new Date().getFullYear();
    configSheet.appendRow(['Clé', 'Valeur']);
    configSheet.appendRow(['company_name', 'NAVALO s.r.o.']);
    configSheet.appendRow(['company_address', 'Radvanická 140/60, 715 00 Michálkovice']);
    configSheet.appendRow(['company_ico', '']);
    configSheet.appendRow(['company_dic', '']);
    configSheet.appendRow(['company_phone', '']);
    configSheet.appendRow(['company_email', '']);
    configSheet.appendRow(['company_bank', '']);
    configSheet.appendRow(['company_iban', '']);
    configSheet.appendRow(['default_vat_rate', 21]);
    configSheet.appendRow([`next_bl_number_${year}`, 1]);
    configSheet.appendRow([`next_po_number_${year}`, 1]);
    configSheet.appendRow([`next_ro_number_${year}`, 1]);
    configSheet.appendRow([`next_fv_number_${year}`, 1]);
    configSheet.appendRow([`next_fp_number_${year}`, 1]);
    configSheet.appendRow([`next_pr_number_${year}`, 1]);
    configSheet.appendRow([`next_pi_number_${year}`, 1]);
    configSheet.appendRow([`next_dev_number_${year}`, 1]);
  }
  
  // Fetch initial exchange rates
  fetchCNBRates();
  
  Logger.log('Spreadsheet initialized successfully!');
  return { success: true, message: 'Initialisation terminée' };
}

// ========================================
// STOCK OPERATIONS WITH FIFO
// ========================================

function getStock() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STOCK);
  const data = sheet.getDataRange().getValues();
  
  const components = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    components[row[0]] = {
      ref: row[0],
      name: row[1],
      category: row[2],
      manufacturer: row[3],
      qty: row[4],
      min: row[5],
      value: row[6],
      lastUpdate: row[7]
    };
  }
  
  return { components };
}

function getStockWithValue() {
  const stock = getStock();
  const valuation = getStockValuation();
  
  return {
    components: stock.components,
    totalValue: valuation.totalValue,
    byCategory: valuation.byCategory
  };
}

function getStockLots(ref) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lotsSheet = ss.getSheetByName(SHEET_NAMES.STOCK_LOTS);
  const data = lotsSheet.getDataRange().getValues();
  
  const lots = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === ref && data[i][5] > 0) {
      lots.push({
        id: data[i][0],
        ref: data[i][1],
        date: data[i][2],
        bonNum: data[i][3],
        qtyInit: data[i][4],
        qtyRemaining: data[i][5],
        priceUnit: data[i][6],
        currency: data[i][7],
        priceCZK: data[i][8],
        supplier: data[i][9],
        rowIndex: i + 1
      });
    }
  }
  
  lots.sort((a, b) => new Date(a.date) - new Date(b.date));
  return lots;
}

function getStockValuation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lotsSheet = ss.getSheetByName(SHEET_NAMES.STOCK_LOTS);
  const stockSheet = ss.getSheetByName(SHEET_NAMES.STOCK);
  const pricesSheet = ss.getSheetByName(SHEET_NAMES.COMPONENT_PRICES);

  // For initial stock (without lots), use exchange rate from 01.01.2026
  // This is the reference date when the system was initialized
  let eurRateInitial = 25.0;
  try {
    const rateInfo = getExchangeRateForDate('EUR', '2026-01-01');
    if (rateInfo.rate) {
      eurRateInitial = rateInfo.rate;
      Logger.log('Using initial stock rate from 01.01.2026: ' + eurRateInitial);
    }
  } catch(e) {
    Logger.log('Could not get rate for 01.01.2026, using default: ' + eurRateInitial);
  }
  
  // Build price map from Prix_Composants
  // Priority: CZK price if > 0, otherwise EUR * rate
  const priceMap = {};
  if (pricesSheet) {
    const pricesData = pricesSheet.getDataRange().getValues();
    Logger.log('Prix_Composants has ' + (pricesData.length - 1) + ' rows');
    
    for (let i = 1; i < pricesData.length; i++) {
      const ref = String(pricesData[i][0] || '').trim();
      
      // Parse EUR price - handle text format with comma/space
      let priceEurRaw = pricesData[i][1];
      let priceEur = 0;
      if (priceEurRaw !== null && priceEurRaw !== undefined && priceEurRaw !== '') {
        priceEur = parseFloat(String(priceEurRaw).replace(/\s/g, '').replace(',', '.')) || 0;
      }
      
      // Parse CZK price - handle text format with comma/space
      let priceCzkRaw = pricesData[i][2];
      let priceCzk = 0;
      if (priceCzkRaw !== null && priceCzkRaw !== undefined && priceCzkRaw !== '') {
        priceCzk = parseFloat(String(priceCzkRaw).replace(/\s/g, '').replace(',', '.')) || 0;
      }
      
      if (ref && (priceEur > 0 || priceCzk > 0)) {
        // Priority: use CZK if available and > 0, otherwise convert EUR using initial rate (01.01.2026)
        if (priceCzk > 0) {
          priceMap[ref] = priceCzk;
          Logger.log('Price for ' + ref + ': ' + priceCzk + ' CZK (direct)');
        } else {
          priceMap[ref] = priceEur * eurRateInitial;
          Logger.log('Price for ' + ref + ': ' + (priceEur * eurRateInitial) + ' CZK (from EUR ' + priceEur + ' at rate ' + eurRateInitial + ')');
        }
      }
    }
  }
  
  Logger.log('Total prices loaded: ' + Object.keys(priceMap).length);
  
  let totalValue = 0;
  const byRef = {};
  const byCategory = {};
  
  // Calculate value from FIFO lots first
  if (lotsSheet) {
    const lotsData = lotsSheet.getDataRange().getValues();
    for (let i = 1; i < lotsData.length; i++) {
      const ref = String(lotsData[i][1]).trim();
      const qtyRemaining = parseFloat(lotsData[i][5]) || 0;
      const priceCZK = parseFloat(lotsData[i][8]) || 0;
      
      if (qtyRemaining > 0 && priceCZK > 0) {
        const value = qtyRemaining * priceCZK;
        totalValue += value;
        byRef[ref] = (byRef[ref] || 0) + value;
      }
    }
  }
  
  // For items without FIFO lots, use Prix_Composants
  const stockData = stockSheet.getDataRange().getValues();
  for (let i = 1; i < stockData.length; i++) {
    const ref = String(stockData[i][0]).trim();
    const category = stockData[i][2] || 'autre';
    const qty = parseFloat(stockData[i][4]) || 0;
    
    let value = byRef[ref] || 0;
    
    // If no FIFO value but has stock and price, calculate value
    if (value === 0 && qty > 0 && priceMap[ref]) {
      value = qty * priceMap[ref];
      totalValue += value;
      byRef[ref] = value;
    }
    
    // Update value column in Stock sheet
    stockSheet.getRange(i + 1, 7).setValue(Math.round(value * 100) / 100);
    byCategory[category] = (byCategory[category] || 0) + value;
  }
  
  Logger.log('Total stock value: ' + totalValue + ' CZK');
  
  return {
    totalValue: Math.round(totalValue * 100) / 100,
    byRef,
    byCategory
  };
}

// ========================================
// RECEIPT PROCESSING WITH FIFO
// ========================================

function processReceipt(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stockSheet = ss.getSheetByName(SHEET_NAMES.STOCK);
  const lotsSheet = ss.getSheetByName(SHEET_NAMES.STOCK_LOTS);
  const historySheet = ss.getSheetByName(SHEET_NAMES.HISTORY);
  const receiptsSheet = ss.getSheetByName(SHEET_NAMES.RECEIPTS);
  const stockData = stockSheet.getDataRange().getValues();
  
  const { bonNum, items, supplier, date, currency, linkedPO } = data;
  const receiptDate = date || new Date();
  const receiptCurrency = currency || 'CZK';
  const receiptId = `REC-${Date.now()}`;
  const receiptNumber = bonNum || getNextDocNumber('pr');

  // Get exchange rate for the receipt date (DUZP)
  let exchangeRate = 1;
  if (receiptCurrency !== 'CZK') {
    // Format date for getExchangeRateForDate (YYYY-MM-DD)
    let dateStr;
    if (typeof receiptDate === 'string') {
      dateStr = receiptDate.split('T')[0];
    } else {
      dateStr = receiptDate.toISOString().split('T')[0];
    }
    const rateInfo = getExchangeRateForDate(receiptCurrency, dateStr);
    if (rateInfo.rate) {
      exchangeRate = rateInfo.rate;
      Logger.log('Using exchange rate ' + exchangeRate + ' for date ' + dateStr);
    } else {
      // Fallback to current rate if historical rate not available
      const currentRate = getExchangeRate(receiptCurrency);
      if (currentRate.rate) exchangeRate = currentRate.rate;
    }
  }
  
  const results = [];
  let totalValue = 0;
  
  items.forEach(item => {
    const priceCZK = item.price ? item.price * exchangeRate : 0;
    totalValue += item.qty * (item.price || 0);
    
    const lotId = `LOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    lotsSheet.appendRow([
      lotId, item.ref, receiptDate, receiptNumber, item.qty, item.qty,
      item.price || 0, receiptCurrency, priceCZK, supplier
    ]);
    
    let found = false;
    for (let i = 1; i < stockData.length; i++) {
      if (stockData[i][0] === item.ref) {
        const newQty = stockData[i][4] + item.qty;
        stockSheet.getRange(i + 1, 5).setValue(newQty);
        stockSheet.getRange(i + 1, 8).setValue(new Date());
        
        historySheet.appendRow([
          receiptDate, 'ENTRÉE', receiptNumber, item.ref, stockData[i][1],
          item.qty, priceCZK, item.qty * priceCZK, supplier
        ]);
        
        results.push({ ref: item.ref, newQty, lotId });
        found = true;
        break;
      }
    }
    
    if (!found) {
      stockSheet.appendRow([item.ref, item.name || item.ref, 'autre', '', item.qty, 5, 0, new Date()]);
      historySheet.appendRow([
        receiptDate, 'ENTRÉE', receiptNumber, item.ref, item.name || item.ref,
        item.qty, priceCZK, item.qty * priceCZK, supplier
      ]);
      results.push({ ref: item.ref, newQty: item.qty, lotId, created: true });
    }
  });
  
  // Save receipt document to Prijemky sheet
  receiptsSheet.appendRow([
    receiptId,
    receiptDate,
    receiptNumber,
    supplier,
    items.length,
    totalValue,
    receiptCurrency,
    linkedPO || '',
    JSON.stringify(items)
  ]);
  
  getStockValuation();
  
  return { success: true, receiptId, receiptNumber, processed: results.length, items: results, exchangeRate };
}

function getReceipts(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.RECEIPTS);
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  const receipts = [];
  
  for (let i = Math.max(1, data.length - limit); i < data.length; i++) {
    let items = [];
    try { items = JSON.parse(data[i][8] || '[]'); } catch(e) {}
    
    receipts.push({
      id: data[i][0],
      date: data[i][1],
      receiptNumber: data[i][2],
      supplier: data[i][3],
      itemCount: data[i][4],
      totalValue: data[i][5],
      currency: data[i][6],
      linkedPO: data[i][7],
      items: items
    });
  }
  
  return receipts.reverse();
}

// ========================================
// DELIVERY PROCESSING WITH FIFO
// ========================================

function processDelivery(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stockSheet = ss.getSheetByName(SHEET_NAMES.STOCK);
  const lotsSheet = ss.getSheetByName(SHEET_NAMES.STOCK_LOTS);
  const historySheet = ss.getSheetByName(SHEET_NAMES.HISTORY);
  const deliveriesSheet = ss.getSheetByName(SHEET_NAMES.DELIVERIES);
  
  const { client, clientAddress, quantities, notes, date, linkedOrderId, clientOrderNumber } = data;
  const blNumber = getNextDocNumber('bl');
  const allBom = getAllBom();
  const stockData = stockSheet.getDataRange().getValues();
  
  const required = {};
  
  Object.entries(quantities).forEach(([model, qty]) => {
    if (qty <= 0) return;
    const bomItems = allBom[model] || [];
    bomItems.forEach(item => {
      if (!required[item.ref]) {
        required[item.ref] = { name: item.name, qty: 0, available: 0 };
      }
      required[item.ref].qty += item.qty * qty;
    });
  });
  
  const errors = [];
  for (let i = 1; i < stockData.length; i++) {
    const ref = stockData[i][0];
    if (required[ref]) {
      required[ref].available = stockData[i][4];
      required[ref].rowIndex = i + 1;
      
      if (required[ref].available < required[ref].qty) {
        errors.push({
          ref, name: required[ref].name,
          required: required[ref].qty, available: required[ref].available
        });
      }
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  let totalValue = 0;
  
  Object.entries(required).forEach(([ref, data]) => {
    let qtyToDeduct = data.qty;
    const lots = getStockLots(ref);
    
    for (const lot of lots) {
      if (qtyToDeduct <= 0) break;
      
      const deductFromLot = Math.min(qtyToDeduct, lot.qtyRemaining);
      const newRemaining = lot.qtyRemaining - deductFromLot;
      
      lotsSheet.getRange(lot.rowIndex, 6).setValue(newRemaining);
      totalValue += deductFromLot * lot.priceCZK;
      qtyToDeduct -= deductFromLot;
    }
    
    const newQty = data.available - data.qty;
    stockSheet.getRange(data.rowIndex, 5).setValue(newQty);
    stockSheet.getRange(data.rowIndex, 8).setValue(new Date());
    
    const avgPrice = data.qty > 0 ? totalValue / data.qty : 0;
    historySheet.appendRow([
      date || new Date(), 'SORTIE', blNumber, ref, data.name,
      -data.qty, avgPrice, -data.qty * avgPrice, client
    ]);
  });
  
  const deliveryId = Utilities.getUuid();
  const totalPac = PAC_MODELS.reduce((sum, model) => sum + (quantities[model] || 0), 0);
  
  deliveriesSheet.appendRow([
    deliveryId, date || new Date(), blNumber, client, clientAddress,
    quantities['TX9'] || 0, quantities['TX12-3PH'] || 0, 
    quantities['TX12-1PH'] || 0, quantities['TH11'] || 0,
    totalPac, Math.round(totalValue * 100) / 100, 'Créé', notes || '',
    linkedOrderId || '', clientOrderNumber || '', '' // invoiceNumber
  ]);
  
  getStockValuation();
  
  return { 
    success: true, deliveryId, blNumber, totalPac,
    totalValue: Math.round(totalValue * 100) / 100,
    componentsDeducted: Object.keys(required).length
  };
}

// ========================================
// PURCHASE ORDERS
// ========================================

function getSuggestedOrders() {
  const stock = getStock();
  const suggestions = [];
  
  Object.values(stock.components).forEach(comp => {
    if (comp.qty <= comp.min) {
      const suggestedQty = Math.max(comp.min * 2 - comp.qty, comp.min);
      suggestions.push({
        ref: comp.ref, name: comp.name, category: comp.category,
        manufacturer: comp.manufacturer, currentQty: comp.qty,
        minQty: comp.min, suggestedQty: suggestedQty,
        status: comp.qty === 0 ? 'critical' : 'low'
      });
    }
  });
  
  suggestions.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'critical' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  
  return suggestions;
}

function createPurchaseOrder(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const poSheet = ss.getSheetByName(SHEET_NAMES.PURCHASE_ORDERS);
  
  const { supplier, items, notes, expectedDate, currency } = data;
  const poNumber = getNextDocNumber('po');
  const poId = Utilities.getUuid();
  
  let totalValue = 0;
  items.forEach(item => {
    totalValue += (item.price || 0) * (item.qty || 0);
  });
  
  poSheet.appendRow([
    poId, new Date(), poNumber, supplier, 'Brouillon',
    items.length, totalValue, currency || 'CZK', notes || '',
    expectedDate || '', JSON.stringify(items)
  ]);
  
  return { success: true, poId, poNumber, totalValue, itemCount: items.length };
}

function getPurchaseOrders(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PURCHASE_ORDERS);
  const data = sheet.getDataRange().getValues();
  
  const orders = [];
  for (let i = Math.max(1, data.length - limit); i < data.length; i++) {
    let items = [];
    try { items = JSON.parse(data[i][10] || '[]'); } catch(e) {}
    
    orders.push({
      id: data[i][0], date: data[i][1], poNumber: data[i][2],
      supplier: data[i][3], status: data[i][4], itemCount: data[i][5],
      totalValue: data[i][6], currency: data[i][7], notes: data[i][8],
      expectedDate: data[i][9], items: items
    });
  }
  
  return orders.reverse();
}

function updatePurchaseOrder(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const poSheet = ss.getSheetByName(SHEET_NAMES.PURCHASE_ORDERS);
  const poData = poSheet.getDataRange().getValues();
  
  const { poId, status, supplier, currency, expectedDate, items, itemCount, totalValue } = data;
  
  for (let i = 1; i < poData.length; i++) {
    if (poData[i][0] === poId) {
      if (status) poSheet.getRange(i + 1, 5).setValue(status);
      if (supplier) poSheet.getRange(i + 1, 4).setValue(supplier);
      if (currency) poSheet.getRange(i + 1, 8).setValue(currency);
      if (expectedDate) poSheet.getRange(i + 1, 10).setValue(expectedDate);
      if (itemCount !== undefined) poSheet.getRange(i + 1, 6).setValue(itemCount);
      if (totalValue !== undefined) poSheet.getRange(i + 1, 7).setValue(totalValue);
      if (items) poSheet.getRange(i + 1, 11).setValue(JSON.stringify(items));
      return { success: true };
    }
  }
  
  return { success: false, error: 'Commande non trouvée' };
}

function deletePurchaseOrder(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const poSheet = ss.getSheetByName(SHEET_NAMES.PURCHASE_ORDERS);
  const poData = poSheet.getDataRange().getValues();
  
  for (let i = 1; i < poData.length; i++) {
    if (poData[i][0] === id) {
      poSheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Commande non trouvée' };
}

// ========================================
// RECEIVED ORDERS (from clients)
// ========================================

function createReceivedOrder(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const roSheet = ss.getSheetByName(SHEET_NAMES.RECEIVED_ORDERS);
  
  const { 
    id, orderNumber, clientOrderNumber, client, address, 
    quantities, prices, notes, date, deliveryDate, currency,
    subtotal, total: totalValue, status
  } = data;
  
  // Use provided orderNumber or generate new one
  const roNumber = orderNumber || getNextDocNumber('ro');
  const roId = id || Utilities.getUuid();
  
  let total = totalValue || 0;
  if (!total) {
    PAC_MODELS.forEach(model => {
      total += (quantities[model] || 0) * (prices[model] || 0);
    });
  }
  
  roSheet.appendRow([
    roId, 
    date || new Date(), 
    roNumber, 
    clientOrderNumber || '',
    client,
    address || '',
    quantities['TX9'] || 0, prices['TX9'] || 0,
    quantities['TX12-3PH'] || 0, prices['TX12-3PH'] || 0,
    quantities['TX12-1PH'] || 0, prices['TX12-1PH'] || 0,
    quantities['TH11'] || 0, prices['TH11'] || 0,
    total, 
    currency || 'EUR', 
    deliveryDate || '',
    status || 'new',
    0, // delivered
    0, // invoiced
    notes || ''
  ]);
  
  return { success: true, roId, roNumber, total };
}

function getReceivedOrders(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.RECEIVED_ORDERS);
  const data = sheet.getDataRange().getValues();
  
  const orders = [];
  for (let i = Math.max(1, data.length - limit); i < data.length; i++) {
    const row = data[i];
    orders.push({
      id: row[0],
      date: row[1],
      orderNumber: row[2],
      clientOrderNumber: row[3],
      client: row[4],
      address: row[5],
      quantities: {
        'TX9': row[6] || 0,
        'TX12-3PH': row[8] || 0,
        'TX12-1PH': row[10] || 0,
        'TH11': row[12] || 0
      },
      prices: {
        'TX9': row[7] || 0,
        'TX12-3PH': row[9] || 0,
        'TX12-1PH': row[11] || 0,
        'TH11': row[13] || 0
      },
      total: row[14] || 0,
      currency: row[15] || 'EUR',
      deliveryDate: row[16],
      status: row[17] || 'new',
      delivered: row[18] || 0,
      invoiced: row[19] || 0,
      notes: row[20] || '',
      driveFileId: row[21] || '',
      driveFileUrl: row[22] || ''
    });
  }

  return orders.reverse();
}

function updateReceivedOrder(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const roSheet = ss.getSheetByName(SHEET_NAMES.RECEIVED_ORDERS);
  const roData = roSheet.getDataRange().getValues();
  
  const { roId, delivered, invoiced, quantities, prices, client, address, 
          deliveryDate, currency, total, status, notes, clientOrderNumber } = data;
  
  for (let i = 1; i < roData.length; i++) {
    if (roData[i][0] === roId) {
      // Update delivery/invoice status
      if (delivered !== undefined) roSheet.getRange(i + 1, 19).setValue(delivered);
      if (invoiced !== undefined) roSheet.getRange(i + 1, 20).setValue(invoiced);
      
      // Update other fields if provided
      if (client) roSheet.getRange(i + 1, 5).setValue(client);
      if (address) roSheet.getRange(i + 1, 6).setValue(address);
      if (clientOrderNumber !== undefined) roSheet.getRange(i + 1, 4).setValue(clientOrderNumber);
      if (deliveryDate) roSheet.getRange(i + 1, 17).setValue(deliveryDate);
      if (currency) roSheet.getRange(i + 1, 16).setValue(currency);
      if (total) roSheet.getRange(i + 1, 15).setValue(total);
      if (status) roSheet.getRange(i + 1, 18).setValue(status);
      if (notes) roSheet.getRange(i + 1, 21).setValue(notes);
      
      // Update quantities and prices if provided
      if (quantities) {
        roSheet.getRange(i + 1, 7).setValue(quantities['TX9'] || 0);
        roSheet.getRange(i + 1, 9).setValue(quantities['TX12-3PH'] || 0);
        roSheet.getRange(i + 1, 11).setValue(quantities['TX12-1PH'] || 0);
        roSheet.getRange(i + 1, 13).setValue(quantities['TH11'] || 0);
      }
      if (prices) {
        roSheet.getRange(i + 1, 8).setValue(prices['TX9'] || 0);
        roSheet.getRange(i + 1, 10).setValue(prices['TX12-3PH'] || 0);
        roSheet.getRange(i + 1, 12).setValue(prices['TX12-1PH'] || 0);
        roSheet.getRange(i + 1, 14).setValue(prices['TH11'] || 0);
      }
      
      return { success: true };
    }
  }
  
  return { success: false, error: 'Commande non trouvée' };
}

function deleteReceivedOrder(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const roSheet = ss.getSheetByName(SHEET_NAMES.RECEIVED_ORDERS);
  const roData = roSheet.getDataRange().getValues();
  
  for (let i = 1; i < roData.length; i++) {
    if (roData[i][0] === id) {
      roSheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Commande non trouvée' };
}

// ========================================
// INVOICES
// ========================================

function createInvoice(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invSheet = ss.getSheetByName(SHEET_NAMES.INVOICES);

  const {
    number, isProforma, varSymbol, client, clientIco, clientDic, clientAddress,
    date, dueDate, taxDate, items, subtotal, vatRate, vat, total, currency,
    exchangeRate, paymentMethod, notes, linkedOrder, linkedOrderNumber,
    clientOrderNumber, linkedProforma, paid, paidDate, depositPercent, depositAmount,
    taxDocSubtotal, taxDocVat, taxDocTotal, paidExchangeRate, paidAmountCZK, paidSubtotalCZK, paidVatCZK
  } = data;

  // Use the number sent by client, or generate one if not provided
  const invNumber = number || getNextDocNumber(isProforma ? 'pf' : 'fv');
  const invId = data.id || Utilities.getUuid();

  // Check if invoice with this number already exists (update instead of create)
  const existingData = invSheet.getDataRange().getValues();
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][1] === invNumber) {
      // Update existing invoice
      const rowNum = i + 1;
      invSheet.getRange(rowNum, 3).setValue(date || new Date());
      invSheet.getRange(rowNum, 4).setValue(dueDate || '');
      invSheet.getRange(rowNum, 5).setValue(client || '');
      invSheet.getRange(rowNum, 6).setValue(subtotal || 0);
      invSheet.getRange(rowNum, 7).setValue(vat || 0);
      invSheet.getRange(rowNum, 8).setValue(total || 0);
      invSheet.getRange(rowNum, 9).setValue(currency || 'CZK');
      invSheet.getRange(rowNum, 10).setValue(paid || false);
      invSheet.getRange(rowNum, 11).setValue(paidDate || '');
      invSheet.getRange(rowNum, 13).setValue(notes || '');
      invSheet.getRange(rowNum, 14).setValue(JSON.stringify(items || []));
      invSheet.getRange(rowNum, 15).setValue(isProforma ? 'proforma' : 'standard');
      invSheet.getRange(rowNum, 16).setValue(vatRate || 21);
      invSheet.getRange(rowNum, 17).setValue(clientAddress || '');
      invSheet.getRange(rowNum, 18).setValue(clientIco || '');
      invSheet.getRange(rowNum, 19).setValue(clientDic || '');
      invSheet.getRange(rowNum, 20).setValue(varSymbol || '');
      invSheet.getRange(rowNum, 21).setValue(taxDate || '');
      invSheet.getRange(rowNum, 22).setValue(exchangeRate || '');
      invSheet.getRange(rowNum, 23).setValue(linkedOrder || '');
      invSheet.getRange(rowNum, 24).setValue(JSON.stringify(linkedProforma || null));
      invSheet.getRange(rowNum, 25).setValue(depositPercent || 100);
      invSheet.getRange(rowNum, 26).setValue(depositAmount || 0);
      invSheet.getRange(rowNum, 27).setValue(taxDocSubtotal || '');
      invSheet.getRange(rowNum, 28).setValue(taxDocVat || '');
      invSheet.getRange(rowNum, 29).setValue(taxDocTotal || '');
      invSheet.getRange(rowNum, 30).setValue(paidExchangeRate || '');
      invSheet.getRange(rowNum, 31).setValue(paidAmountCZK || '');
      invSheet.getRange(rowNum, 32).setValue(paidSubtotalCZK || '');
      invSheet.getRange(rowNum, 33).setValue(paidVatCZK || '');
      return { success: true, invId: existingData[i][0], invNumber, updated: true };
    }
  }

  // Create new invoice
  invSheet.appendRow([
    invId,                              // A: id
    invNumber,                          // B: number
    date || new Date(),                 // C: date
    dueDate || '',                      // D: dueDate
    client || '',                       // E: client
    subtotal || 0,                      // F: subtotal
    vat || 0,                           // G: vat
    total || 0,                         // H: total
    currency || 'CZK',                  // I: currency
    paid || false,                      // J: paid
    paidDate || '',                     // K: paidDate
    '',                                 // L: linkedBL (legacy)
    notes || '',                        // M: notes
    JSON.stringify(items || []),        // N: items
    isProforma ? 'proforma' : 'standard', // O: type
    vatRate || 21,                      // P: vatRate
    clientAddress || '',                // Q: clientAddress
    clientIco || '',                    // R: clientIco
    clientDic || '',                    // S: clientDic
    varSymbol || '',                    // T: varSymbol
    taxDate || '',                      // U: taxDate
    exchangeRate || '',                 // V: exchangeRate
    linkedOrder || '',                  // W: linkedOrder
    JSON.stringify(linkedProforma || null), // X: linkedProforma
    depositPercent || 100,              // Y: depositPercent
    depositAmount || 0,                 // Z: depositAmount
    taxDocSubtotal || '',               // AA: taxDocSubtotal
    taxDocVat || '',                    // AB: taxDocVat
    taxDocTotal || '',                  // AC: taxDocTotal
    paidExchangeRate || '',             // AD: paidExchangeRate
    paidAmountCZK || '',                // AE: paidAmountCZK
    paidSubtotalCZK || '',              // AF: paidSubtotalCZK
    paidVatCZK || ''                    // AG: paidVatCZK
  ]);

  return { success: true, invId, invNumber };
}

function getInvoices(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.INVOICES);
  const data = sheet.getDataRange().getValues();

  const invoices = [];
  for (let i = Math.max(1, data.length - limit); i < data.length; i++) {
    let items = [];
    try { items = JSON.parse(data[i][13] || '[]'); } catch(e) {}

    let linkedProforma = null;
    try { linkedProforma = JSON.parse(data[i][23] || 'null'); } catch(e) {}

    const type = data[i][14] || 'standard';

    invoices.push({
      id: data[i][0],
      number: data[i][1],
      date: data[i][2],
      dueDate: data[i][3],
      client: data[i][4],
      subtotal: data[i][5],
      vat: data[i][6],
      total: data[i][7],
      currency: data[i][8],
      paid: data[i][9],
      paidDate: data[i][10],
      linkedBL: data[i][11],
      notes: data[i][12],
      items: items,
      type: type,
      isProforma: type === 'proforma',
      vatRate: data[i][15] || 21,
      clientAddress: data[i][16] || '',
      clientIco: data[i][17] || '',
      clientDic: data[i][18] || '',
      varSymbol: data[i][19] || '',
      taxDate: data[i][20] || '',
      exchangeRate: data[i][21] || null,
      linkedOrder: data[i][22] || '',
      linkedProforma: linkedProforma,
      depositPercent: data[i][24] || 100,
      depositAmount: data[i][25] || 0,
      taxDocSubtotal: data[i][26] || null,
      taxDocVat: data[i][27] || null,
      taxDocTotal: data[i][28] || null,
      paidExchangeRate: data[i][29] || null,
      paidAmountCZK: data[i][30] || null,
      paidSubtotalCZK: data[i][31] || null,
      paidVatCZK: data[i][32] || null
    });
  }

  return invoices.reverse();
}

// ========================================
// RECEIVED INVOICES
// ========================================

function createReceivedInvoice(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const recInvSheet = ss.getSheetByName(SHEET_NAMES.RECEIVED_INVOICES);
  
  if (!recInvSheet) {
    return { success: false, error: 'Sheet Factures_Recues not found. Run initializeSpreadsheet() first.' };
  }
  
  const { id, internalNumber, number, supplier, subtotal, vat, total, currency, date, dueDate, taxDate, linkedReceipt, notes } = data;
  
  // Check if invoice with this ID already exists
  const existingData = recInvSheet.getDataRange().getValues();
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === id || existingData[i][1] === internalNumber) {
      // Update existing invoice instead of creating duplicate
      recInvSheet.getRange(i + 1, 3).setValue(number || '');
      recInvSheet.getRange(i + 1, 4).setValue(date || new Date());
      recInvSheet.getRange(i + 1, 5).setValue(dueDate || '');
      recInvSheet.getRange(i + 1, 6).setValue(taxDate || '');
      recInvSheet.getRange(i + 1, 7).setValue(supplier || '');
      recInvSheet.getRange(i + 1, 8).setValue(subtotal || 0);
      recInvSheet.getRange(i + 1, 9).setValue(vat || 0);
      recInvSheet.getRange(i + 1, 10).setValue(total || 0);
      recInvSheet.getRange(i + 1, 11).setValue(currency || 'CZK');
      recInvSheet.getRange(i + 1, 14).setValue(linkedReceipt || '');
      recInvSheet.getRange(i + 1, 15).setValue(notes || '');
      
      Logger.log('Updated existing received invoice: ' + id + ' / ' + internalNumber);
      return { success: true, invId: existingData[i][0], internalNumber: existingData[i][1], updated: true };
    }
  }
  
  // Use provided ID and internalNumber - DO NOT generate new ones
  const invId = id;
  const invNumber = internalNumber;
  
  if (!invId || !invNumber) {
    return { success: false, error: 'ID and internalNumber are required' };
  }
  
  recInvSheet.appendRow([
    invId, invNumber, number || '', date || new Date(),
    dueDate || '', taxDate || '', supplier || '',
    subtotal || 0, vat || 0, total || 0,
    currency || 'CZK', false, '', linkedReceipt || '', notes || ''
  ]);
  
  Logger.log('Created received invoice: ' + invId + ' / ' + invNumber);
  
  return { success: true, invId, internalNumber: invNumber, created: true };
}

function getReceivedInvoices(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.RECEIVED_INVOICES);
  const data = sheet.getDataRange().getValues();
  
  const invoices = [];
  for (let i = Math.max(1, data.length - limit); i < data.length; i++) {
 invoices.push({                                                                                                                                                               
        id: data[i][0], internalNumber: data[i][1], number: data[i][2],                                                                                                             
        date: data[i][3], dueDate: data[i][4], taxDate: data[i][5],                                                                                                                 
        supplier: data[i][6], subtotal: data[i][7], vat: data[i][8],                                                                                                                
        total: data[i][9], currency: data[i][10], paid: data[i][11],                                                                                                                
        paidDate: data[i][12], linkedReceipt: data[i][13], notes: data[i][14],                                                                                                      
        driveFileId: data[i][15] || '', driveFileUrl: data[i][16] || ''                                                                                                             
      });  
  }
  
  return invoices.reverse();
}

function updateReceivedInvoice(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const recInvSheet = ss.getSheetByName(SHEET_NAMES.RECEIVED_INVOICES);
  const invData = recInvSheet.getDataRange().getValues();
  
   const { invId, paid, paidDate, driveFileId, driveFileUrl, driveDownloadUrl } = data;                                                                                          
                                                                                                                                                                                    
      for (let i = 1; i < invData.length; i++) {                                                                                                                                    
        if (invData[i][0] === invId) {                                                                                                                                              
          if (paid !== undefined) recInvSheet.getRange(i + 1, 12).setValue(paid);                                                                                                   
          if (paidDate) recInvSheet.getRange(i + 1, 13).setValue(paidDate);                                                                                                         
          if (driveFileId) recInvSheet.getRange(i + 1, 16).setValue(driveFileId);                                                                                                   
          if (driveFileUrl) recInvSheet.getRange(i + 1, 17).setValue(driveFileUrl);                                                                                                 
          return { success: true };                                                                                                                                                 
        }                                                                                                                                                                           
      }                            
  
  return { success: false, error: 'Facture non trouvée' };
}

function deleteReceivedInvoice(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const recInvSheet = ss.getSheetByName(SHEET_NAMES.RECEIVED_INVOICES);
  const invData = recInvSheet.getDataRange().getValues();
  
  for (let i = 1; i < invData.length; i++) {
    if (invData[i][0] === id) {
      recInvSheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Facture non trouvée' };
}

// ========================================
// BOM OPERATIONS
// ========================================

function getAllBom() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bom = {};

  const sheetMap = {
    'TX9': SHEET_NAMES.BOM_TX9,
    'TX12-3PH': SHEET_NAMES.BOM_TX12_3PH,
    'TX12-1PH': SHEET_NAMES.BOM_TX12_1PH,
    'TH11': SHEET_NAMES.BOM_TH11
  };

  PAC_MODELS.forEach(model => {
    const sheetName = sheetMap[model];
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    bom[model] = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        bom[model].push({
          ref: data[i][0], name: data[i][1], category: data[i][2],
          qty: data[i][3], manufacturer: data[i][4]
        });
      }
    }
  });

  return bom;
}

function saveBom(bomData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetMap = {
    'TX9': SHEET_NAMES.BOM_TX9,
    'TX12-3PH': SHEET_NAMES.BOM_TX12_3PH,
    'TX12-1PH': SHEET_NAMES.BOM_TX12_1PH,
    'TH11': SHEET_NAMES.BOM_TH11
  };

  let updated = 0;

  Object.keys(bomData).forEach(model => {
    const sheetName = sheetMap[model];
    if (!sheetName) return;

    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      // Create sheet if it doesn't exist
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(['Référence', 'Désignation', 'Catégorie', 'Quantité', 'Fabricant']);
    }

    // Clear existing data (keep header)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
    }

    // Write new BOM items
    const items = bomData[model] || [];
    items.forEach((item, index) => {
      sheet.getRange(index + 2, 1, 1, 5).setValues([[
        item.ref || '',
        item.name || '',
        item.category || '',
        item.qty || 1,
        item.manufacturer || ''
      ]]);
    });

    updated++;
    Logger.log('Updated BOM for model ' + model + ' with ' + items.length + ' items');
  });

  return { success: true, modelsUpdated: updated };
}

// ========================================
// CONTACTS
// ========================================

function getContacts(type) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.CONTACTS);
  const data = sheet.getDataRange().getValues();

  const contacts = [];
  for (let i = 1; i < data.length; i++) {
    if (!type || data[i][1] === type) {
      contacts.push({
        id: data[i][0],
        type: data[i][1],
        name: data[i][2],
        address: data[i][3],
        ico: data[i][4],
        dic: data[i][5],
        email: data[i][6],
        phone: data[i][7],
        currency: data[i][8],
        notes: data[i][9],
        bankAccount: data[i][10] || '',
        iban: data[i][11] || '',
        bic: data[i][12] || '',
        createdAt: data[i][13] || ''
      });
    }
  }

  return contacts;
}

function saveContact(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.CONTACTS);
  const existingData = sheet.getDataRange().getValues();

  const { id, type, name, address, ico, dic, email, phone, currency, notes, bankAccount, iban, bic, createdAt } = data;

  if (id) {
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] === id) {
        sheet.getRange(i + 1, 1, 1, 14).setValues([[
          id, type, name, address, ico || '', dic || '',
          email || '', phone || '', currency || 'CZK', notes || '',
          bankAccount || '', iban || '', bic || '', existingData[i][13] || createdAt || new Date()
        ]]);
        return { success: true, id };
      }
    }
  }

  const newId = Utilities.getUuid();
  sheet.appendRow([
    newId, type, name, address, ico || '', dic || '',
    email || '', phone || '', currency || 'CZK', notes || '',
    bankAccount || '', iban || '', bic || '', createdAt || new Date()
  ]);

  return { success: true, id: newId };
}

function deleteContact(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.CONTACTS);
  const existingData = sheet.getDataRange().getValues();

  const { id } = data;
  if (!id) return { success: false, error: 'ID manquant' };

  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true, id };
    }
  }

  return { success: false, error: 'Contact non trouvé' };
}

// ========================================
// COMPONENT PRICES
// ========================================

function getComponentPrices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.COMPONENT_PRICES);
  const data = sheet.getDataRange().getValues();

  const prices = {};
  for (let i = 1; i < data.length; i++) {
    const ref = String(data[i][0] || '').trim();
    if (!ref) continue;

    // Parse EUR price - handle text format with comma/space
    let priceEur = 0;
    const eurRaw = data[i][1];
    if (eurRaw !== null && eurRaw !== undefined && eurRaw !== '') {
      priceEur = parseFloat(String(eurRaw).replace(/\s/g, '').replace(',', '.')) || 0;
    }

    // Parse CZK price - handle text format with comma/space
    let priceCzk = 0;
    const czkRaw = data[i][2];
    if (czkRaw !== null && czkRaw !== undefined && czkRaw !== '') {
      priceCzk = parseFloat(String(czkRaw).replace(/\s/g, '').replace(',', '.')) || 0;
    }

    prices[ref] = {
      ref: ref,
      eur: priceEur,
      czk: priceCzk,
      supplier: data[i][3] || '',
      lastUpdate: data[i][4] || ''
    };
  }

  Logger.log('Loaded ' + Object.keys(prices).length + ' component prices');
  return prices;
}

function updateComponentPrice(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.COMPONENT_PRICES);
  const existingData = sheet.getDataRange().getValues();
  
  const { ref, eur, czk, supplier } = data;
  
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === ref) {
      sheet.getRange(i + 1, 1, 1, 5).setValues([[
        ref, eur || existingData[i][1], czk || existingData[i][2],
        supplier || existingData[i][3], new Date()
      ]]);
      return { success: true, ref };
    }
  }
  
  sheet.appendRow([ref, eur || 0, czk || 0, supplier || '', new Date()]);
  return { success: true, ref, created: true };
}

// ========================================
// CONFIG
// ========================================

function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  const data = sheet.getDataRange().getValues();
  
  const config = {};
  for (let i = 1; i < data.length; i++) {
    config[data[i][0]] = data[i][1];
  }
  
  return config;
}

function updateConfig(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  const existingData = sheet.getDataRange().getValues();
  
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'action') return;
    
    let found = false;
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        found = true;
        break;
      }
    }
    
    if (!found) {
      sheet.appendRow([key, value]);
    }
  });
  
  return { success: true };
}

// ========================================
// HISTORY & OTHER GETTERS
// ========================================

function getHistory(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.HISTORY);
  const data = sheet.getDataRange().getValues();
  
  const history = [];
  for (let i = Math.max(1, data.length - limit); i < data.length; i++) {
    history.push({
      date: data[i][0], type: data[i][1], docNum: data[i][2],
      ref: data[i][3], name: data[i][4], qty: data[i][5],
      priceUnit: data[i][6], value: data[i][7], partner: data[i][8]
    });
  }
  
  return history.reverse();
}

function getDeliveries(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.DELIVERIES);
  const data = sheet.getDataRange().getValues();
  
  const deliveries = [];
  for (let i = Math.max(1, data.length - limit); i < data.length; i++) {
    deliveries.push({
      id: data[i][0], date: data[i][1], blNumber: data[i][2],
      client: data[i][3], clientAddress: data[i][4],
      quantities: {
        'TX9': data[i][5], 'TX12-3PH': data[i][6],
        'TX12-1PH': data[i][7], 'TH11': data[i][8]
      },
      total: data[i][9], value: data[i][10],
      status: data[i][11], notes: data[i][12],
      linkedOrderId: data[i][13] || '',
      clientOrderNumber: data[i][14] || '',
      invoiceNumber: data[i][15] || ''
    });
  }
  
  return deliveries.reverse();
}

function deleteDelivery(data) {
  if (typeof data === 'string') data = { id: data };
  const id = data.id;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const deliveriesSheet = ss.getSheetByName(SHEET_NAMES.DELIVERIES);
  const stockSheet = ss.getSheetByName(SHEET_NAMES.STOCK);
  const historySheet = ss.getSheetByName(SHEET_NAMES.HISTORY);
  const deliveryData = deliveriesSheet.getDataRange().getValues();

  let deliveryRow = -1;
  let delivery = null;

  for (let i = 1; i < deliveryData.length; i++) {
    if (deliveryData[i][0] === id) {
      deliveryRow = i + 1;
      delivery = {
        id: deliveryData[i][0],
        blNumber: deliveryData[i][2],
        tx9: deliveryData[i][5] || 0,
        tx12_3ph: deliveryData[i][6] || 0,
        tx12_1ph: deliveryData[i][7] || 0,
        th11: deliveryData[i][8] || 0
      };
      break;
    }
  }

  if (deliveryRow === -1) {
    return { success: false, error: 'Livraison non trouvée' };
  }

  // Restore stock using BOM
  const quantities = {};
  if (delivery.tx9 > 0) quantities['TX9'] = delivery.tx9;
  if (delivery.tx12_3ph > 0) quantities['TX12-3PH'] = delivery.tx12_3ph;
  if (delivery.tx12_1ph > 0) quantities['TX12-1PH'] = delivery.tx12_1ph;
  if (delivery.th11 > 0) quantities['TH11'] = delivery.th11;

  // Also merge quantities passed from client (for newer delivery format)
  if (data.quantities) {
    Object.entries(data.quantities).forEach(([model, qty]) => {
      if (qty > 0) quantities[model] = qty;
    });
  }

  const allBom = getAllBom();
  const stockData = stockSheet.getDataRange().getValues();

  // Calculate required components to restore
  const toRestore = {};
  Object.entries(quantities).forEach(([model, qty]) => {
    const bomItems = allBom[model] || [];
    bomItems.forEach(item => {
      if (!toRestore[item.ref]) {
        toRestore[item.ref] = { name: item.name, qty: 0 };
      }
      toRestore[item.ref].qty += item.qty * qty;
    });
  });

  // Restore stock quantities
  for (let i = 1; i < stockData.length; i++) {
    const ref = stockData[i][0];
    if (toRestore[ref]) {
      const currentQty = stockData[i][4] || 0;
      stockSheet.getRange(i + 1, 5).setValue(currentQty + toRestore[ref].qty);
      stockSheet.getRange(i + 1, 8).setValue(new Date());
    }
  }

  // Remove history entries for this delivery's BL number
  const blNumber = delivery.blNumber || data.blNumber;
  if (blNumber) {
    const histData = historySheet.getDataRange().getValues();
    for (let i = histData.length - 1; i >= 1; i--) {
      if (histData[i][2] === blNumber) {
        historySheet.deleteRow(i + 1);
      }
    }
  }

  // Delete the delivery row
  deliveriesSheet.deleteRow(deliveryRow);

  return { success: true, restoredComponents: Object.keys(toRestore).length };
}

function getPacStock() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PAC_STOCK);
  const data = sheet.getDataRange().getValues();
  
  const pac = {};
  for (let i = 1; i < data.length; i++) {
    pac[data[i][0]] = data[i][1];
  }
  
  return pac;
}

// ========================================
// COMPONENT MANAGEMENT
// ========================================

function addComponent(component) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STOCK);
  
  sheet.appendRow([
    component.ref, component.name, component.category,
    component.manufacturer || '', component.qty || 0,
    component.min || 5, 0, new Date()
  ]);
  
  return { success: true, ref: component.ref };
}

// ========================================
// IMPORT BOM DATA (including TH11)
// ========================================

function importBomData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // TH11 BOM
  const bomTh11 = [
    ['C-SBS120H38A', 'Kompresor Sanyo C-SBS120H38A', 'refrigeration', 1, 'Sanyo'],
    ['00063', 'Ventil plnící ¼"', 'refrigeration', 2, ''],
    ['00062_LP_0.7/1.7', 'Presostat LP ACB-2UA521W', 'refrigeration', 1, 'Danfoss'],
    ['00062_HP_26', 'Presostat HP ACB-2UB507W', 'refrigeration', 1, 'Danfoss'],
    ['TGEN2,5_134', 'Ventil expanzní TGEN2.5/R134a Danfoss 067N5192', 'refrigeration', 1, 'Danfoss'],
    ['03998_AB', 'Výparník sušička BPA02AH21 - 4coils', 'echangeur', 1, ''],
    ['03999_AB', 'Kondenzátor sušička BPA12AH22 - 4coils', 'echangeur', 1, ''],
    ['6.04726.0000', 'Filtr Emerson FDB 084S dehydrátor jednosměrný', 'refrigeration', 1, 'Emerson'],
    ['6.04677.0000', 'Průhledítko Sanhua 12mm SYJ-42025', 'refrigeration', 1, 'Sanhua'],
    ['4715136', 'Presostat HP s pájecí trubičkou PS1-A5L', 'refrigeration', 1, ''],
    ['00170', 'Pryžová podložka pod sběrač', 'mecanique', 1, ''],
    ['04451_B', 'Chladič sušička', 'echangeur', 1, ''],
    ['R134a', 'Chladivo R134a (kg)', 'refrigeration', 2.7, ''],
    ['01413', 'Sběrač chladiva 1,6l', 'refrigeration', 1, ''],
    ['Sada_komplet_Cu', 'Kompletní sada Cu trubek T9/T11', 'tuyauterie', 1, 'Navalo'],
  ];
  
  // TX9 BOM
  const bomTx9 = [
    ['WHP05100BSV', 'Kompresor Highly', 'refrigeration', 1, 'Highly'],
    ['00063', 'Ventil plnící ¼"', 'refrigeration', 2, ''],
    ['00062_LP_0.7/1.7', 'Presostat ACB-2UA521W (LP)', 'refrigeration', 1, 'Danfoss'],
    ['00062_HP_26', 'Presostat ACB-2UB507W (HP)', 'refrigeration', 1, 'Danfoss'],
    ['01789', 'Ventil elektromagnetický ALCO 110 RB 2T2', 'refrigeration', 1, 'ALCO'],
    ['801033', 'Cívka elektromagnetická 24V ESC', 'electrique', 1, ''],
    ['0712174', 'Koncovka svorkovnice k elektromag. ventilu', 'electrique', 1, ''],
    ['068U2215', 'Ventil expanzní TUAE', 'refrigeration', 1, 'Danfoss'],
    ['068U1036', 'Tryska k TUAE ventilu', 'refrigeration', 1, 'Danfoss'],
    ['WVFX_10', 'Ventil vodní 3/8"', 'refrigeration', 1, ''],
    ['060-017166', 'Kapilára pro WVFX', 'refrigeration', 1, ''],
    ['DML_053S', 'Filtr dehydrátor DML 053S', 'refrigeration', 1, 'Danfoss'],
    ['YCV-15009', 'Ventil zpětný SANHUA 10mm', 'refrigeration', 1, 'Sanhua'],
    ['R134a', 'Chladivo R134a (kg)', 'refrigeration', 1.1, ''],
    ['B5THx16/1P-SC-M', 'Swep B5THx16/1P-SC-M (économiseur)', 'echangeur', 1, 'Swep'],
    ['04878_AE', 'Výparník BP302AH06 - 4coils', 'echangeur', 1, ''],
    ['04879_AG', 'Kondenzátor BP312AH07 - 4coils', 'echangeur', 1, ''],
    ['11547_HYDRA', 'Capacitátor MKB MKP 50/500/2149', 'electrique', 1, 'Hydra'],
    ['TX9_kabel_svazek', 'Sada kabelových svazků pro TX9', 'electrique', 1, 'Navalo'],
    ['571903', 'Difuzor TX9HP', 'mecanique', 1, 'Navalo'],
    ['vsuvka_mosaz_3/8_3/4', 'Vsuvka mosazná redukovaná 3/8" na 3/4"', 'mecanique', 2, ''],
    ['pas_upinaci_2,5_25mm', 'Upínací pás se spojkou 25mm/2,5', 'mecanique', 2, ''],
    ['10060', 'Distanční sloupek pro kompresor Highly', 'mecanique', 3, 'Navalo'],
    ['EPP_SADA_TX9', 'Opláštění sada pro TX9', 'epp', 1, 'JSP/ARPRO'],
  ];
  
  // TX12-3PH BOM
  const bomTx12_3ph = [
    ['WHP15600VSDPC9EQ', 'Kompresor WHP15600VSDPC9EQ', 'refrigeration', 1, 'Highly'],
    ['CV-240180-3FHE', 'Driver Invertek CV-240180-3FHE', 'electrique', 1, 'Invertek'],
    ['10263239', 'Výparník LU-VE', 'echangeur', 1, 'LU-VE'],
    ['10263238', 'Kondenzátor LU-VE', 'echangeur', 1, 'LU-VE'],
    ['R513A', 'Chladivo R513A (kg)', 'refrigeration', 1.25, ''],
    ['1111111111', 'Sloupek pro TX12-18', 'mecanique', 3, 'Navalo'],
    ['POS455', 'Climatix POS455', 'electronique', 1, 'Siemens'],
    ['DML_053S', 'Filtr dehydrátor DML 053S', 'refrigeration', 1, 'Danfoss'],
    ['034G6505', 'Expanzní ventil ETS 5M35L', 'refrigeration', 1, 'Danfoss'],
    ['034G3860', 'Cívka expanzního ventilu - 1m', 'refrigeration', 1, 'Danfoss'],
    ['YCQB03L18', 'Vysokotlaké čidlo (HP sensor)', 'electronique', 1, 'Sanhua'],
    ['YCQB02L01', 'Nízkotlaké čidlo (LP sensor)', 'electronique', 1, 'Sanhua'],
    ['ACB-2UB480W', 'HP presostat', 'refrigeration', 1, 'Danfoss'],
    ['TG4A', 'Teplotní čidlo NTC10k', 'electronique', 2, 'Sensit'],
    ['TX12_el_svazek', 'El. svazek TX12-18', 'electrique', 1, 'Navalo'],
    ['PE3300-16-06', 'PE3300-16-06 - EMI filtr 3ph', 'electrique', 1, 'Pioneer'],
    ['00063', 'Ventil plnící ¼"', 'refrigeration', 4, ''],
    ['YCV-15009', 'Ventil zpětný SANHUA 10mm', 'refrigeration', 1, 'Sanhua'],
    ['Sada_komplet_cu_TX18', 'Sada trubky TX12-18', 'tuyauterie', 1, 'Navalo'],
    ['Plastovy_vytok', 'Plastový výtok', 'autre', 1, ''],
    ['EPP_komplet_TX12', 'EPP TX12-18', 'epp', 1, 'JSP/ARPRO'],
  ];
  
  // TX12-1PH BOM
  const bomTx12_1ph = [
    ['WHP15600VSDPC9EQ', 'Kompresor WHP15600VSDPC9EQ', 'refrigeration', 1, 'Highly'],
    ['CV-220200-1FHP', 'Driver Invertek CV-220200-1FHP (1ph)', 'electrique', 1, 'Invertek'],
    ['10263239', 'Výparník LU-VE', 'echangeur', 1, 'LU-VE'],
    ['10263238', 'Kondenzátor LU-VE', 'echangeur', 1, 'LU-VE'],
    ['R513A', 'Chladivo R513A (kg)', 'refrigeration', 1.25, ''],
    ['1111111111', 'Sloupek pro TX12-18', 'mecanique', 3, 'Navalo'],
    ['POS455', 'Climatix POS455', 'electronique', 1, 'Siemens'],
    ['DML_053S', 'Filtr dehydrátor DML 053S', 'refrigeration', 1, 'Danfoss'],
    ['034G6505', 'Expanzní ventil ETS 5M35L', 'refrigeration', 1, 'Danfoss'],
    ['034G3860', 'Cívka expanzního ventilu - 1m', 'refrigeration', 1, 'Danfoss'],
    ['YCQB03L18', 'Vysokotlaké čidlo (HP sensor)', 'electronique', 1, 'Sanhua'],
    ['YCQB02L01', 'Nízkotlaké čidlo (LP sensor)', 'electronique', 1, 'Sanhua'],
    ['ACB-2UB480W', 'HP presostat', 'refrigeration', 1, 'Danfoss'],
    ['TG4A', 'Teplotní čidlo NTC10k', 'electronique', 2, 'Sensit'],
    ['TX12_el_svazek', 'El. svazek TX12-18', 'electrique', 1, 'Navalo'],
    ['PE2300-25-06', 'PE2300-25-06 - EMI filtr 1ph', 'electrique', 1, 'Pioneer'],
    ['00063', 'Ventil plnící ¼"', 'refrigeration', 4, ''],
    ['YCV-15009', 'Ventil zpětný SANHUA 10mm', 'refrigeration', 1, 'Sanhua'],
    ['Sada_komplet_cu_TX18', 'Sada trubky TX12-18', 'tuyauterie', 1, 'Navalo'],
    ['Plastovy_vytok', 'Plastový výtok', 'autre', 1, ''],
    ['EPP_komplet_TX12', 'EPP TX12-18', 'epp', 1, 'JSP/ARPRO'],
  ];
  
  // Write BOMs
  const bomData = {
    [SHEET_NAMES.BOM_TX9]: bomTx9,
    [SHEET_NAMES.BOM_TX12_3PH]: bomTx12_3ph,
    [SHEET_NAMES.BOM_TX12_1PH]: bomTx12_1ph,
    [SHEET_NAMES.BOM_TH11]: bomTh11
  };
  
  Object.entries(bomData).forEach(([sheetName, data]) => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet && sheet.getLastRow() <= 1) {
      sheet.getRange(2, 1, data.length, 5).setValues(data);
    }
  });
  
  // Initialize Stock from all BOMs
  const allComponents = {};
  [...bomTx9, ...bomTx12_3ph, ...bomTx12_1ph, ...bomTh11].forEach(row => {
    if (!allComponents[row[0]]) {
      allComponents[row[0]] = {
        ref: row[0], name: row[1], category: row[2],
        manufacturer: row[4], qty: 0,
        min: row[2] === 'refrigeration' ? 10 : 5
      };
    }
  });
  
  const stockSheet = ss.getSheetByName(SHEET_NAMES.STOCK);
  if (stockSheet.getLastRow() <= 1) {
    const stockData = Object.values(allComponents).map(c => [
      c.ref, c.name, c.category, c.manufacturer, c.qty, c.min, 0, new Date()
    ]);
    stockSheet.getRange(2, 1, stockData.length, 8).setValues(stockData);
  }
  
  Logger.log('BOM data imported successfully!');
  return { success: true, message: 'Données BOM importées (TX9, TX12-3PH, TX12-1PH, TH11)' };
}

// ========================================
// IMPORT COMPONENT PRICES FROM data.js
// ========================================

function importComponentPrices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.COMPONENT_PRICES);
  
  // Component prices (from data.js COMPONENT_PRICES)
  const prices = [
    // TX12-18 Components
    ['WHP15600VSDPC9EQ', 166.00, null, 'Highly'],
    ['PE3300-16-06', 62.00, null, 'Pioneer'],
    ['CV-240180-3FHE', 275.00, null, 'Invertek'],
    ['CV-220200-1FHP', 250.00, null, 'Invertek'],
    ['10263239', 238.00, null, 'LU-VE'],
    ['10263238', 150.50, null, 'LU-VE'],
    ['R513A', 45.23, null, 'Chemours'],
    ['POS455', 120.00, null, 'Siemens'],
    ['DML_053S', 4.32, null, 'Danfoss'],
    ['YCV-15009', 8.24, null, 'Sanhua'],
    ['034G6505', 16.27, null, 'Danfoss'],
    ['034G3860', 8.50, null, 'Danfoss'],
    ['YCQB03L18', 19.45, null, 'Sanhua'],
    ['YCQB02L01', 18.16, null, 'Sanhua'],
    ['ACB-2UB480W', 7.00, null, 'Danfoss'],
    ['00063', 1.34, null, ''],
    ['TG4A', 3.95, null, 'Sensit'],
    ['TX12_el_svazek', 28.00, null, 'Navalo'],
    ['Sada_komplet_cu_TX18', 55.00, null, 'Navalo'],
    ['EPP_komplet_TX12', 75.00, null, 'JSP/ARPRO'],
    ['1111111111', 1.50, null, 'Navalo'],
    ['Plastovy_vytok', 2.50, null, ''],
    ['PE2300-25-06', 55.00, null, 'Pioneer'],
    
    // TX9 Components
    ['WHP05100BSV', 100.10, null, 'Highly'],
    ['WHP05100VUX', 100.10, null, 'Highly'],
    ['00062_LP_0.7/1.7', 7.60, null, 'Danfoss'],
    ['00062_HP_26', 8.00, null, 'Danfoss'],
    ['01789', 12.00, null, 'ALCO'],
    ['801033', 7.80, null, ''],
    ['0712174', 1.60, null, ''],
    ['B5THx16/1P-SC-M', 41.30, null, 'Swep'],
    ['068U2215', 36.50, null, 'Danfoss'],
    ['068U1036', 9.20, null, 'Danfoss'],
    ['WVFX_10', 56.20, null, ''],
    ['060-017166', 5.10, null, ''],
    ['04878_AE', 123.20, null, ''],
    ['04879_AG', 97.00, null, ''],
    ['11547_HYDRA', 6.80, null, 'Hydra'],
    ['R134a', 13.10, null, ''],
    ['TX9_kabel_svazek', 23.00, null, 'Navalo'],
    ['571903', 5.00, null, 'Navalo'],
    ['vsuvka_mosaz_3/8_3/4', 0.90, null, ''],
    ['pas_upinaci_2,5_25mm', 1.70, null, ''],
    ['10060', 0.20, null, 'Navalo'],
    ['EPP_SADA_TX9', 62.10, null, 'JSP/ARPRO'],
    
    // TH11 Components
    ['C-SBS120H38A', 160.00, null, 'Sanyo'],
    ['C-SBN263H5A', 110.00, null, 'Sanyo'],
    ['TGEN2,5_134', 49.00, null, 'Danfoss'],
    ['03998_AB', 183.00, null, ''],
    ['03999_AB', 157.00, null, ''],
    ['6.04726.0000', 9.10, null, 'Emerson'],
    ['6.04677.0000', 8.10, null, 'Sanhua'],
    ['4715136', 32.10, null, ''],
    ['00170', 0.20, null, ''],
    ['04451_B', 74.30, null, ''],
    ['01413', 68.70, null, ''],
    ['Sada_komplet_Cu', 45.00, null, 'Navalo'],
  ];
  
  if (sheet.getLastRow() <= 1) {
    const dataWithDate = prices.map(row => [...row, new Date()]);
    sheet.getRange(2, 1, dataWithDate.length, 5).setValues(dataWithDate);
  }
  
  Logger.log('Component prices imported successfully!');
  return { success: true, message: 'Prix des composants importés' };
}

// ========================================
// SCHEDULED RATE UPDATE
// ========================================

function scheduledRateUpdate() {
  fetchCNBRates();
  Logger.log('Exchange rates updated');
}

function createDailyTrigger() {
  ScriptApp.newTrigger('scheduledRateUpdate')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();
}

// ========================================
// GOOGLE DRIVE INTEGRATION
// ========================================

function uploadToDrive(data) {
  const { fileName, fileData, fileType, folderId, invoiceId, orderId, folderName } = data;

  try {
    // Get or create the folder
    let folder;
    if (folderId) {
      folder = DriveApp.getFolderById(folderId);
    } else {
      // Use provided folderName or default to invoices folder
      const targetFolderName = folderName || 'NAVALO_Faktury_Prijate';
      const folders = DriveApp.getFoldersByName(targetFolderName);
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(targetFolderName);
      }
    }

    // Decode base64 file data
    const decodedData = Utilities.base64Decode(fileData.split(',').pop());
    const blob = Utilities.newBlob(decodedData, fileType, fileName);

    // Create file in Drive
    const file = folder.createFile(blob);

    // Set file to be viewable by anyone with link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const fileUrl = file.getUrl();
    const downloadUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;

    // Update the invoice in the sheet with the Drive link
    if (invoiceId) {
      updateReceivedInvoiceDriveLink(invoiceId, fileId, fileUrl);
    }

    // Update the received order in the sheet with the Drive link
    if (orderId) {
      updateReceivedOrderDriveLink(orderId, fileId, fileUrl);
    }

    return {
      success: true,
      fileId: fileId,
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      fileName: fileName
    };
  } catch (e) {
    return {
      success: false,
      error: e.toString()
    };
  }
}

function updateReceivedInvoiceDriveLink(invoiceId, driveFileId, driveFileUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.RECEIVED_INVOICES);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === invoiceId) {
      // Add drive link columns if they don't exist (columns 16, 17)
      sheet.getRange(i + 1, 16).setValue(driveFileId);
      sheet.getRange(i + 1, 17).setValue(driveFileUrl);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Invoice not found' };
}

function updateReceivedOrderDriveLink(orderId, driveFileId, driveFileUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.RECEIVED_ORDERS);
  if (!sheet) return { success: false, error: 'ReceivedOrders sheet not found' };

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      // Columns 22 and 23 (1-based) = driveFileId and driveFileUrl
      sheet.getRange(i + 1, 22).setValue(driveFileId);
      sheet.getRange(i + 1, 23).setValue(driveFileUrl);
      return { success: true };
    }
  }

  return { success: false, error: 'Order not found' };
}

function getDriveFile(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return {
      success: true,
      fileId: fileId,
      fileName: file.getName(),
      fileUrl: file.getUrl(),
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
      mimeType: file.getMimeType()
    };
  } catch (e) {
    return {
      success: false,
      error: e.toString()
    };
  }
}

function listDriveInvoices() {
  const folderName = 'NAVALO_Faktury_Prijate';
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (!folders.hasNext()) {
    return { success: true, files: [] };
  }
  
  const folder = folders.next();
  const files = folder.getFiles();
  const fileList = [];
  
  while (files.hasNext()) {
    const file = files.next();
    fileList.push({
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: file.getUrl(),
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId(),
      createdDate: file.getDateCreated()
    });
  }
  
  return { success: true, files: fileList };
}

// ========================================
// DEBUG FUNCTION - Test price reading
// ========================================

function testPriceReading() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pricesSheet = ss.getSheetByName(SHEET_NAMES.COMPONENT_PRICES);
  
  if (!pricesSheet) {
    Logger.log('ERROR: Prix_Composants sheet not found!');
    return;
  }
  
  const pricesData = pricesSheet.getDataRange().getValues();
  Logger.log('=== PRIX_COMPOSANTS DEBUG ===');
  Logger.log('Total rows: ' + pricesData.length);
  Logger.log('Headers: ' + JSON.stringify(pricesData[0]));
  
  // Show first 10 rows
  for (let i = 1; i < Math.min(11, pricesData.length); i++) {
    const ref = pricesData[i][0];
    const eurRaw = pricesData[i][1];
    const czkRaw = pricesData[i][2];
    
    const eurParsed = parseFloat(String(eurRaw || '').replace(/\s/g, '').replace(',', '.')) || 0;
    const czkParsed = parseFloat(String(czkRaw || '').replace(/\s/g, '').replace(',', '.')) || 0;
    
    Logger.log('Row ' + i + ': Ref=' + ref + 
               ' | EUR raw=' + JSON.stringify(eurRaw) + ' parsed=' + eurParsed +
               ' | CZK raw=' + JSON.stringify(czkRaw) + ' parsed=' + czkParsed);
  }
  
  Logger.log('=== END DEBUG ===');
}



// ========================================
// FACTURES PROFORMA
// ========================================

/**
 * Crée une nouvelle facture proforma
 */
function createProformaInvoice(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const invSheet = ss.getSheetByName(SHEET_NAMES.INVOICES);
    
    const { client, items, subtotal, vat, total, currency, dueDate, linkedBL, notes } = data;
    
    // Générer numéro proforma: PI-YYYY-###
    const proformaNumber = getNextDocNumber('pi');
    const invId = Utilities.getUuid();
    
    // Ajouter la facture avec type "proforma"
    invSheet.appendRow([
      invId, 
      proformaNumber,  // N° Facture (format PI-YYYY-###)
      new Date(),      // Date
      dueDate || '',   // Échéance
      client,          // Client
      subtotal || 0,   // HT
      vat || 0,        // TVA
      total || 0,      // TTC
      currency || 'EUR', // Devise
      false,           // Payée
      '',              // Date Paiement
      linkedBL || '',  // BL Lié
      notes || '',     // Notes
      JSON.stringify(items || []), // Items JSON
      'proforma'       // Type
    ]);
    
    return { 
      success: true, 
      invId, 
      proformaNumber, 
      type: 'proforma' 
    };
  }
  
  /**
   * Convertit une facture proforma en facture standard
   */
  function convertProformaToInvoice(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const invSheet = ss.getSheetByName(SHEET_NAMES.INVOICES);
    const invData = invSheet.getDataRange().getValues();
    
    const { proformaId } = data;
    
    // Trouver la facture proforma
    for (let i = 1; i < invData.length; i++) {
      if (invData[i][0] === proformaId) {
        // Vérifier que c'est bien une proforma
        const type = invData[i][14] || '';
        if (type !== 'proforma') {
          return { success: false, error: 'Cette facture n\'est pas une proforma' };
        }
        
        // Générer nouveau numéro de facture standard: FV-YYYY-###
        const newInvoiceNumber = getNextDocNumber('fv');
        
        // Mettre à jour le numéro et le type
        invSheet.getRange(i + 1, 2).setValue(newInvoiceNumber);  // Colonne B: N° Facture
        invSheet.getRange(i + 1, 15).setValue('standard');       // Colonne O: Type
        
        return { 
          success: true, 
          invId: invData[i][0],
          oldNumber: invData[i][1],
          newNumber: newInvoiceNumber,
          type: 'standard'
        };
      }
    }
    
    return { success: false, error: 'Facture proforma non trouvée' };
  }
  
  // ========================================
  // DEVIS / OFFRES DE PRIX
  // ========================================
  
  /**
   * Crée un nouveau devis
   */
  function createQuote(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Créer la feuille Devis si elle n'existe pas
    let quoteSheet = ss.getSheetByName('Devis');
    if (!quoteSheet) {
      quoteSheet = ss.insertSheet('Devis');
      quoteSheet.appendRow([
        'ID', 'N° Devis', 'Date', 'Validité', 'Client', 'Adresse',
        'HT', 'TVA', 'TTC', 'Devise', 'Statut', 'Converti', 'N° Facture',
        'Notes', 'Items JSON'
      ]);
      quoteSheet.getRange(1, 1, 1, 15).setFontWeight('bold')
        .setBackground('#00897b').setFontColor('white');
    }
    
    const { client, address, items, subtotal, vat, total, currency, validityDate, notes } = data;
    
    // Générer numéro devis: DEV-YYYY-###
    const quoteNumber = getNextDocNumber('dev');
    const quoteId = Utilities.getUuid();
    
    quoteSheet.appendRow([
      quoteId,
      quoteNumber,
      new Date(),
      validityDate || '',
      client,
      address || '',
      subtotal || 0,
      vat || 0,
      total || 0,
      currency || 'EUR',
      'draft',         // Statut: draft, sent, accepted, rejected
      false,           // Converti en commande/facture
      '',              // N° Facture (si converti)
      notes || '',
      JSON.stringify(items || [])
    ]);
    
    return { 
      success: true, 
      quoteId, 
      quoteNumber,
      type: 'quote'
    };
  }
  
  /**
   * Récupère la liste des devis
   */
  function getQuotes(limit) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Devis');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    const quotes = [];
    
    for (let i = Math.max(1, data.length - limit); i < data.length; i++) {
      let items = [];
      try { items = JSON.parse(data[i][14] || '[]'); } catch(e) {}
      
      quotes.push({
        id: data[i][0],
        number: data[i][1],
        date: data[i][2],
        validityDate: data[i][3],
        client: data[i][4],
        address: data[i][5],
        subtotal: data[i][6],
        vat: data[i][7],
        total: data[i][8],
        currency: data[i][9],
        status: data[i][10],
        converted: data[i][11],
        invoiceNumber: data[i][12],
        notes: data[i][13],
        items: items
      });
    }
    
    return quotes.reverse();
  }
  
  /**
   * Met à jour le statut d'un devis
   */
  function updateQuote(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const quoteSheet = ss.getSheetByName('Devis');
    
    if (!quoteSheet) {
      return { success: false, error: 'Feuille Devis non trouvée' };
    }
    
    const quoteData = quoteSheet.getDataRange().getValues();
    const { quoteId, status, converted, invoiceNumber } = data;
    
    for (let i = 1; i < quoteData.length; i++) {
      if (quoteData[i][0] === quoteId) {
        if (status) quoteSheet.getRange(i + 1, 11).setValue(status);
        if (converted !== undefined) quoteSheet.getRange(i + 1, 12).setValue(converted);
        if (invoiceNumber) quoteSheet.getRange(i + 1, 13).setValue(invoiceNumber);
        return { success: true };
      }
    }
    
    return { success: false, error: 'Devis non trouvé' };
  }
  
  /**
   * Convertit un devis en facture
   */
  function convertQuoteToInvoice(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const quoteSheet = ss.getSheetByName('Devis');
    
    if (!quoteSheet) {
      return { success: false, error: 'Feuille Devis non trouvée' };
    }
    
    const quoteData = quoteSheet.getDataRange().getValues();
    const { quoteId } = data;
    
    // Trouver le devis
    for (let i = 1; i < quoteData.length; i++) {
      if (quoteData[i][0] === quoteId) {
        // Récupérer les données du devis
        const quoteInfo = {
          client: quoteData[i][4],
          items: JSON.parse(quoteData[i][14] || '[]'),
          subtotal: quoteData[i][6],
          vat: quoteData[i][7],
          total: quoteData[i][8],
          currency: quoteData[i][9],
          notes: 'Converti depuis devis ' + quoteData[i][1]
        };
        
        // Créer la facture
        const invoiceResult = createInvoice(quoteInfo);
        
        if (invoiceResult.success) {
          // Marquer le devis comme converti
          quoteSheet.getRange(i + 1, 11).setValue('converted');
          quoteSheet.getRange(i + 1, 12).setValue(true);
          quoteSheet.getRange(i + 1, 13).setValue(invoiceResult.invNumber);
          
          return {
            success: true,
            quoteNumber: quoteData[i][1],
            invoiceNumber: invoiceResult.invNumber,
            invoiceId: invoiceResult.invId
          };
        } else {
          return invoiceResult;
        }
      }
    }
    
    return { success: false, error: 'Devis non trouvé' };
  }
  
  /**
   * Supprime un devis
   */
  function deleteQuote(quoteId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const quoteSheet = ss.getSheetByName('Devis');
    
    if (!quoteSheet) {
      return { success: false, error: 'Feuille Devis non trouvée' };
    }
    
    const quoteData = quoteSheet.getDataRange().getValues();
    
    for (let i = 1; i < quoteData.length; i++) {
      if (quoteData[i][0] === quoteId) {
        quoteSheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    
    return { success: false, error: 'Devis non trouvé' };
  }