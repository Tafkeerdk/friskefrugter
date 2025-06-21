import { z } from 'zod';

// Danish EAN validation helper
const validateEAN13 = (ean: string): boolean => {
  if (!/^\d{13}$/.test(ean)) return false;
  
  // EAN-13 checksum validation
  const digits = ean.split('').map(Number);
  const checksum = digits.slice(0, 12).reduce((sum, digit, index) => {
    return sum + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);
  
  const calculatedCheck = (10 - (checksum % 10)) % 10;
  return calculatedCheck === digits[12];
};

// Danish currency validation (DKK)
const danishCurrencySchema = z.number()
  .min(0.01, 'Prisen skal være større end 0 kr')
  .max(999999.99, 'Prisen må ikke overstige 999.999,99 kr')
  .refine((val) => {
    // Ensure max 2 decimal places for DKK
    return Number(val.toFixed(2)) === val;
  }, 'Prisen må kun have op til 2 decimaler');

// Product name validation with Danish characters
const produktnavnSchema = z.string()
  .min(1, 'Produktnavn er obligatorisk')
  .max(100, 'Produktnavn må maksimalt være 100 tegn')
  .regex(/^[a-zA-ZæøåÆØÅ0-9\s\-.,()&]+$/, 'Produktnavn indeholder ugyldige tegn')
  .refine((val) => val.trim().length > 0, 'Produktnavn må ikke kun bestå af mellemrum');

// Description validation
const beskrivelseSchema = z.string()
  .max(1000, 'Beskrivelse må maksimalt være 1000 tegn')
  .optional()
  .transform((val) => val?.trim() || undefined);

// EAN number validation - NON-BLOCKING for 13 digits
const eanNummerSchema = z.string()
  .optional()
  .refine((val) => {
    if (!val) return true; // Optional field
    // If it's 13 digits, always allow it (even if checksum is wrong)
    if (/^\d{13}$/.test(val)) return true;
    // For non-13 digit values, do full validation
    return validateEAN13(val);
  }, 'EAN-nummer skal være 13 cifre');

// Unit enum with Danish labels
const enhedSchema = z.enum(['kg', 'stk', 'bakke', 'kasse'], {
  required_error: 'Vælg en enhed',
  invalid_type_error: 'Ugyldig enhed valgt'
});

// Category validation
const kategoriSchema = z.object({
  id: z.string().optional(),
  navn: z.string()
    .min(1, 'Kategori navn er påkrævet')
    .max(50, 'Kategori navn må maksimalt være 50 tegn')
    .regex(/^[a-zA-ZæøåÆØÅ0-9\s\-&]+$/, 'Kategori navn indeholder ugyldige tegn'),
  isNew: z.boolean().default(false)
}).refine((data) => {
  // If it's a new category, id should not be present
  if (data.isNew && data.id) return false;
  // If it's an existing category, id should be present
  if (!data.isNew && !data.id) return false;
  return true;
}, {
  message: 'Kategori data er inkonsistent',
  path: ['navn']
});

// Inventory management validation
const lagerstyringSchema = z.object({
  enabled: z.boolean().default(false),
  antalPaaLager: z.number()
    .int('Antal på lager skal være et helt tal')
    .min(0, 'Antal på lager kan ikke være negativt')
    .max(999999, 'Antal på lager er for højt')
    .optional(),
  minimumslager: z.number()
    .int('Minimumslager skal være et helt tal')
    .min(0, 'Minimumslager kan ikke være negativt')
    .max(999999, 'Minimumslager er for højt')
    .optional()
}).refine((data) => {
  if (data.enabled && data.antalPaaLager === undefined) {
    return false;
  }
  return true;
}, {
  message: 'Antal på lager er påkrævet når lagerstyring er aktiveret',
  path: ['antalPaaLager']
}).refine((data) => {
  if (data.enabled && data.minimumslager !== undefined && data.antalPaaLager !== undefined) {
    return data.minimumslager <= data.antalPaaLager;
  }
  return true;
}, {
  message: 'Minimumslager kan ikke være højere end antal på lager',
  path: ['minimumslager']
});

// Image validation - supports both new uploads and existing images
const billedeSchema = z.object({
  // For new uploads
  file: z.instanceof(File, { message: 'Ugyldig fil' }).optional(),
  preview: z.string().optional(),
  compressed: z.boolean().default(false),
  id: z.string().optional(),
  isPrimary: z.boolean().optional(),
  
  // For existing images from database
  _id: z.string().optional(),
  url: z.string().optional(),
  filename: z.string().optional(),
  originalname: z.string().optional(),
  size: z.number().optional(),
  uploadedAt: z.string().optional(),
  
  // Indicates if this is an existing image or new upload
  isExisting: z.boolean().optional()
}).refine((data) => {
  // Either it's an existing image (has url) or a new upload (has file)
  return (data.isExisting && data.url) || (!data.isExisting && data.file);
}, {
  message: 'Billede skal enten være en eksisterende fil eller en ny upload',
  path: ['file']
}).refine((data) => {
  // For new uploads, validate file type
  if (!data.isExisting && data.file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return allowedTypes.includes(data.file.type);
  }
  return true;
}, {
  message: 'Kun JPEG, PNG og WebP billeder er tilladt',
  path: ['file']
}).refine((data) => {
  // For new uploads, validate file size (5MB max)
  if (!data.isExisting && data.file) {
    const maxSize = 5 * 1024 * 1024;
    return data.file.size <= maxSize;
  }
  return true;
}, {
  message: 'Billedet må maksimalt være 5MB',
  path: ['file']
});

// Main product setup schema
export const productSetupSchema = z.object({
  produktnavn: produktnavnSchema,
  beskrivelse: beskrivelseSchema,
  eanNummer: eanNummerSchema,
  enhed: enhedSchema,
  basispris: danishCurrencySchema,
  kategori: kategoriSchema,
  lagerstyring: lagerstyringSchema,
  billeder: z.array(billedeSchema)
    .min(1, 'Mindst ét billede er påkrævet')
    .max(3, 'Maksimalt 3 billeder er tilladt'),
  aktiv: z.boolean().default(true)
});

// Type inference from schema
export type ProductSetupFormData = z.infer<typeof productSetupSchema>;

// Partial schema for draft validation (less strict)
export const productDraftSchema = productSetupSchema.partial({
  produktnavn: true,
  basispris: true,
  kategori: true,
  billeder: true
});

export type ProductDraftData = z.infer<typeof productDraftSchema>;

// Schema for individual field validation
export const fieldValidationSchemas = {
  produktnavn: produktnavnSchema,
  beskrivelse: beskrivelseSchema,
  eanNummer: eanNummerSchema,
  enhed: enhedSchema,
  basispris: danishCurrencySchema,
  kategoriNavn: z.string().min(1, 'Kategori navn er påkrævet'),
  antalPaaLager: z.number().int().min(0).optional(),
  minimumslager: z.number().int().min(0).optional()
};

// Custom validation messages in Danish
export const validationMessages = {
  required: 'Dette felt er påkrævet',
  invalid_type: 'Ugyldig værdi',
  too_small: 'Værdien er for lille',
  too_big: 'Værdien er for stor',
  invalid_string: 'Ugyldig tekst',
  invalid_number: 'Ugyldig nummer',
  invalid_boolean: 'Ugyldig boolean værdi',
  invalid_date: 'Ugyldig dato',
  invalid_email: 'Ugyldig email adresse',
  invalid_url: 'Ugyldig URL',
  custom: 'Ugyldig værdi'
} as const; 