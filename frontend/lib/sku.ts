// ============================================================
// Utilitário de Geração de SKU com Famílias
// Formato: SRV-FAM-XXX (ex: SRV-HID-001, SRV-ELE-015)
// ============================================================

export const FAMILY_CODES: Record<string, string> = {
  'Hidráulica': 'HID',
  'Elétrica': 'ELE',
  'Marcenaria': 'MAR',
  'Instalação': 'INS',
  'Montagem de Móveis': 'MON',
  'Limpeza': 'LIM',
};

export const FAMILY_NAMES: Record<string, string> = {
  'HID': 'Hidráulica',
  'ELE': 'Elétrica',
  'MAR': 'Marcenaria',
  'INS': 'Instalação',
  'MON': 'Montagem de Móveis',
  'LIM': 'Limpeza',
  'GER': 'Geral',
};

export function getFamilyCode(category: string): string {
  const normalized = category?.trim() || '';
  return FAMILY_CODES[normalized] || 'GER';
}

export function generateSkuFromFamily(category: string, sequence: number): string {
  const fam = getFamilyCode(category);
  const seq = String(sequence).padStart(3, '0');
  return `SRV-${fam}-${seq}`;
}

export function parseSkuFamily(sku: string): { family: string; sequence: number } | null {
  const match = sku?.match(/^SRV-([A-Z]{3})-(\d{3})$/);
  if (!match) return null;
  return {
    family: match[1],
    sequence: parseInt(match[2], 10),
  };
}

export function getAllFamilyCodes(): Array<{ code: string; name: string }> {
  return [
    { code: 'HID', name: 'Hidráulica' },
    { code: 'ELE', name: 'Elétrica' },
    { code: 'MAR', name: 'Marcenaria' },
    { code: 'INS', name: 'Instalação' },
    { code: 'MON', name: 'Montagem de Móveis' },
    { code: 'LIM', name: 'Limpeza' },
    { code: 'GER', name: 'Geral' },
  ];
}
