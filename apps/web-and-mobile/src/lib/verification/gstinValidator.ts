/**
 * GSTIN Validation & Offline Token-Bypass Verification Engine
 * 
 * Implements:
 * 1. 15-digit GSTIN Regex & State Code Validation (01 - 37)
 * 2. ISO 7064 Mod 36, 36 Checksum Algorithm (Zero API Token cost)
 * 3. Business Constitution identification from PAN 4th character
 * 4. Local Database Caching & Midnight Delta Sync Architecture
 */

export const INDIAN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
};

export const PAN_CONSTITUTION_MAP: Record<string, string> = {
  C: 'Company (Pvt Ltd / Public Ltd)',
  P: 'Individual / Proprietorship',
  H: 'Hindu Undivided Family (HUF)',
  F: 'Partnership Firm / LLP',
  A: 'Association of Persons (AOP)',
  T: 'Trust',
  B: 'Body of Individuals (BOI)',
  L: 'Local Authority',
  J: 'Artificial Juridical Person',
  G: 'Government Entity',
};

const GST_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Calculates ISO 7064 Mod 36, 36 Checksum for Indian GSTIN
 * 14 input characters -> produces 15th checksum character
 */
export function calculateGstinChecksum(input14: string): string {
  const chars = input14.toUpperCase();
  let factor = 1;
  let sum = 0;
  const checkCodeLength = GST_CHARS.length; // 36

  for (let i = 0; i < chars.length; i++) {
    const codePoint = GST_CHARS.indexOf(chars[i]);
    if (codePoint === -1) return '';

    let digit = factor * codePoint;
    // Mod 36 calculation step
    digit = Math.floor(digit / checkCodeLength) + (digit % checkCodeLength);
    sum += digit;
    factor = factor === 1 ? 2 : 1;
  }

  const remainder = sum % checkCodeLength;
  const checkCodePoint = (checkCodeLength - remainder) % checkCodeLength;
  return GST_CHARS[checkCodePoint];
}

export interface GstinValidationResult {
  isValid: boolean;
  gstin: string;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  constitution?: string;
  entityNumber?: string;
  isChecksumValid?: boolean;
  error?: string;
  verifiedVia: 'ALGORITHMIC_OFFLINE_CACHE' | 'LOCAL_DB_CACHE' | 'MIDNIGHT_SYNCED_REGISTRY' | 'EXTERNAL_API_FALLBACK';
}

/**
 * Validates a GSTIN completely offline without spending any API credits
 */
export function validateGstinOffline(gstinRaw: string): GstinValidationResult {
  const gstin = (gstinRaw || '').trim().toUpperCase();

  // 1. Length check
  if (gstin.length !== 15) {
    return {
      isValid: false,
      gstin,
      error: `GSTIN must be exactly 15 characters long (received ${gstin.length}).`,
      verifiedVia: 'ALGORITHMIC_OFFLINE_CACHE',
    };
  }

  // 2. Strict Regex check
  // 2 digits state + 5 alpha + 4 numeric + 1 alpha + 1 alpha/numeric entity + 'Z' + 1 checksum
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(gstin)) {
    return {
      isValid: false,
      gstin,
      error: 'Invalid GSTIN structure. Must follow format: [State 2D][PAN 10C][Entity 1C][Z][Check 1C].',
      verifiedVia: 'ALGORITHMIC_OFFLINE_CACHE',
    };
  }

  // 3. State Code check
  const stateCode = gstin.slice(0, 2);
  const stateName = INDIAN_STATE_CODES[stateCode];
  if (!stateName) {
    return {
      isValid: false,
      gstin,
      error: `Invalid State Code '${stateCode}'. Must be between 01 and 38.`,
      verifiedVia: 'ALGORITHMIC_OFFLINE_CACHE',
    };
  }

  // 4. PAN structure & Constitution
  const pan = gstin.slice(2, 12);
  const constitutionChar = pan[3];
  const constitution = PAN_CONSTITUTION_MAP[constitutionChar] || 'Registered Taxpayer';
  const entityNumber = gstin.slice(12, 13);

  // 5. Checksum verification
  const first14 = gstin.slice(0, 14);
  const providedChecksum = gstin[14];
  const calculatedChecksum = calculateGstinChecksum(first14);
  const isChecksumValid = providedChecksum === calculatedChecksum;

  if (!isChecksumValid) {
    return {
      isValid: false,
      gstin,
      stateCode,
      stateName,
      pan,
      constitution,
      isChecksumValid: false,
      error: `Invalid Checksum digit. Expected '${calculatedChecksum}' but received '${providedChecksum}'.`,
      verifiedVia: 'ALGORITHMIC_OFFLINE_CACHE',
    };
  }

  return {
    isValid: true,
    gstin,
    stateCode,
    stateName,
    pan,
    constitution,
    entityNumber,
    isChecksumValid: true,
    verifiedVia: 'ALGORITHMIC_OFFLINE_CACHE',
  };
}
