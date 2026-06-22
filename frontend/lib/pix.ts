// ============================================================
// Utilitário de Geração de Payload PIX Copia-e-Cola
// Formato BR Code PIX Estático
// ============================================================

function crc16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePixPayload(params: {
  key: string;
  amount: number;
  name: string;
  city?: string;
}): string {
  const { key, amount, name, city = 'SAO PAULO' } = params;

  const merchantName = name.substring(0, 25).toUpperCase();
  const merchantCity = city.substring(0, 15).toUpperCase();

  // GUI BRasil PIX
  const gui = formatField('00', 'br.gov.bcb.pix');
  const keyField = formatField('01', key);
  const pixKey = formatField('26', gui + keyField);

  // Dados do merchant
  const descMerchant = formatField('62', '');

  // Valor (se informado)
  const amountField = amount > 0 ? formatField('54', amount.toFixed(2)) : '';

  // Montar payload sem CRC
  const payload = [
    formatField('00', '01'),           // Payload Format Indicator
    pixKey,                             // Chave PIX
    formatField('52', '0000'),         // Merchant Category Code
    formatField('53', '986'),          // Transaction Currency (BRL)
    amountField,                        // Amount
    formatField('58', 'BR'),           // Country Code
    formatField('59', merchantName),   // Merchant Name
    formatField('60', merchantCity),   // Merchant City
    descMerchant,                       // Additional Data Field
  ].join('');

  // Adicionar CRC16
  const withCrc = payload + '6304';
  const crc = crc16(withCrc);

  return withCrc + crc;
}

export function formatPixCopieECola(payload: string): string {
  return payload;
}

export function getPixQRCodeUrl(payload: string): string {
  const encoded = encodeURIComponent(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
}
