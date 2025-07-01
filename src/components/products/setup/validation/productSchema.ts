import { z } from 'zod';

// EAN validation helper
const validateEAN13 = (ean: string): boolean => {
  if (!ean || ean.length !== 13) return false;
  
  const digits = ean.split('').map(Number);
  if (digits.some(isNaN)) return false;
  
  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  
  const checksum = (10 - (sum % 10)) % 10;
  return checksum === digits[12];
};

// Danish currency validation (DKK)
const danishCurrencySchema = z.number()
  .min(0.01, 'Prisen skal være større end 0 kr')
  .max(999999.99, 'Prisen må ikke overstige 999.999,99 kr')
  .refine((val) => {
    // Ensure max 2 decimal places for DKK
    return Number(val.toFixed(2)) === val;
  }, 'Prisen må kun have op til 2 decimaler');

// Optional Danish currency validation (for discount fields)
const optionalDanishCurrencySchema = z.number()
  .min(0.01, 'Prisen skal være større end 0 kr')
  .max(999999.99, 'Prisen må ikke overstige 999.999,99 kr')
  .refine((val) => {
    // Ensure max 2 decimal places for DKK
    return Number(val.toFixed(2)) === val;
  }, 'Prisen må kun have op til 2 decimaler')
  .optional();

// Discount percentage validation
const discountPercentageSchema = z.number()
  .min(0, 'Rabat procent skal være 0 eller højere')
  .max(100, 'Rabat procent må ikke overstige 100%')
  .refine((val) => {
    // Ensure max 2 decimal places
    return Number(val.toFixed(2)) === val;
  }, 'Rabat procent må kun have op til 2 decimaler')
  .optional();

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

// Varenummer validation - now optional
const varenummerSchema = z.string()
  .max(50, 'Varenummer må maksimalt være 50 tegn')
  .regex(/^[A-Za-z0-9\-_]*$/, 'Varenummer må kun indeholde bogstaver, tal, bindestreg og underscore')
  .optional()
  .transform((val) => val?.trim() || undefined);

// Unit validation (now using ObjectId)
const enhedSchema = z.string()
  .min(1, 'Vælg en enhed')
  .regex(/^[0-9a-fA-F]{24}$/, 'Ugyldig enhed valgt');

// Category validation
const kategoriSchema = z.object({
  id: z.string().optional(),
  navn: z.string().min(1, 'Kategori navn er påkrævet'),
  isNew: z.boolean().optional()
});

// Inventory management validation
const lagerstyringSchema = z.object({
  enabled: z.boolean().default(false),
  antalPaaLager: z.number().int().min(0).optional(),
  minimumslager: z.number().int().min(0).optional()
}).refine((data) => {
  // If inventory management is enabled, stock amount is required
  if (data.enabled && (data.antalPaaLager === undefined || data.antalPaaLager === null)) {
    return false;
  }
  return true;
}, {
  message: 'Antal på lager er påkrævet når lagerstyring er aktiveret',
  path: ['antalPaaLager']
}).refine((data) => {
  // Minimum stock cannot exceed current stock
  if (data.antalPaaLager !== undefined && data.minimumslager !== undefined) {
    return data.minimumslager <= data.antalPaaLager;
  }
  return true;
}, {
  message: 'Minimumslager kan ikke være højere end antal på lager',
  path: ['minimumslager']
});

// General Product Discount validation
const discountSchema = z.object({
  enabled: z.boolean().default(false),
  beforePrice: optionalDanishCurrencySchema,
  discountPercentage: discountPercentageSchema,
  discountAmount: optionalDanishCurrencySchema,
  eligibleDiscountGroups: z.array(z.string()).optional(),
  eligibleCustomers: z.array(z.string()).optional(),
  showStrikethrough: z.boolean().default(true),
  discountLabel: z.string().max(50, 'Rabat label må maksimalt være 50 tegn').optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional()
}).refine((data) => {
  // If discount is enabled, at least one discount value must be provided
  if (data.enabled) {
    const hasBeforePrice = data.beforePrice !== undefined && data.beforePrice !== null;
    const hasPercentage = data.discountPercentage !== undefined && data.discountPercentage !== null;
    const hasAmount = data.discountAmount !== undefined && data.discountAmount !== null;
    
    if (!hasBeforePrice && !hasPercentage && !hasAmount) {
      return false;
    }
  }
  return true;
}, {
  message: 'Når rabat er aktiveret, skal mindst én rabat-værdi angives (før-pris, procent eller beløb)',
  path: ['enabled']
}).refine((data) => {
  // If valid dates are provided, validFrom should be before validTo
  if (data.validFrom && data.validTo) {
    const fromDate = new Date(data.validFrom);
    const toDate = new Date(data.validTo);
    return fromDate < toDate;
  }
  return true;
}, {
  message: 'Gyldig fra-dato skal være før gyldig til-dato',
  path: ['validTo']
});

// Image validation - supports both new uploads and existing images - COMPLETELY OPTIONAL
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
  altText: z.string().optional(),
  
  // Indicates if this is an existing image or new upload
  isExisting: z.boolean().optional()
}).refine((data) => {
  // Images are completely optional - always allow empty/undefined images
  if (!data.file && !data.url && !data.isExisting) {
    return true; // Allow completely empty images
  }
  // Only validate if there's actual data
  if (data.file || data.url || data.isExisting) {
    return (data.isExisting && data.url) || (!data.isExisting && data.file);
  }
  return true; // Default to allowing empty
}, {
  message: 'Billede skal enten være en eksisterende fil eller en ny upload',
  path: ['file']
}).refine((data) => {
  // For new uploads, validate file type only if file exists
  if (!data.isExisting && data.file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return allowedTypes.includes(data.file.type);
  }
  return true;
}, {
  message: 'Kun JPEG, PNG og WebP billeder er tilladt',
  path: ['file']
}).refine((data) => {
  // For new uploads, validate file size only if file exists (5MB max)
  if (!data.isExisting && data.file) {
    const maxSize = 5 * 1024 * 1024;
    return data.file.size <= maxSize;
  }
  return true;
}, {
  message: 'Billedet må maksimalt være 5MB',
  path: ['file']
});

// Main product setup schema - images are completely optional
export const productSetupSchema = z.object({
  produktnavn: produktnavnSchema,
  varenummer: varenummerSchema,
  beskrivelse: beskrivelseSchema,
  eanNummer: eanNummerSchema,
  enhed: enhedSchema,
  basispris: danishCurrencySchema,
  discount: discountSchema,
  kategori: kategoriSchema,
  lagerstyring: lagerstyringSchema,
  billeder: z.array(billedeSchema)
    .max(3, 'Maksimalt 3 billeder er tilladt')
    .optional()
    .default([])
    .transform((images) => {
      // Filter out any empty/invalid images to ensure clean data
      if (!images || !Array.isArray(images)) return [];
      return images.filter(img => 
        (img.file && !img.isExisting) || 
        (img.url && img.isExisting) ||
        (img._id && img.url)
      );
    }),
  aktiv: z.boolean().default(true)
}).refine((data) => {
  // If discount is enabled with beforePrice, beforePrice must be higher than basispris
  if (data.discount.enabled && data.discount.beforePrice) {
    return data.discount.beforePrice > data.basispris;
  }
  return true;
}, {
  message: 'Før-prisen skal være højere end den nuværende pris',
  path: ['discount', 'beforePrice']
});

// Edit mode schema - billeder field is completely optional for updates
export const productEditSchema = z.object({
  produktnavn: produktnavnSchema,
  varenummer: varenummerSchema,
  beskrivelse: beskrivelseSchema,
  eanNummer: eanNummerSchema,
  enhed: enhedSchema,
  basispris: danishCurrencySchema,
  discount: discountSchema,
  kategori: kategoriSchema,
  lagerstyring: lagerstyringSchema,
  billeder: z.array(billedeSchema)
    .max(3, 'Maksimalt 3 billeder er tilladt')
    .optional()
    .default([])
    .transform((images) => {
      // Filter out any empty/invalid images to ensure clean data
      if (!images || !Array.isArray(images)) return [];
      return images.filter(img => 
        (img.file && !img.isExisting) || 
        (img.url && img.isExisting) ||
        (img._id && img.url)
      );
    }),
  aktiv: z.boolean().default(true)
}).refine((data) => {
  // If discount is enabled with beforePrice, beforePrice must be higher than basispris
  if (data.discount.enabled && data.discount.beforePrice) {
    return data.discount.beforePrice > data.basispris;
  }
  return true;
}, {
  message: 'Før-prisen skal være højere end den nuværende pris',
  path: ['discount', 'beforePrice']
});

export type ProductSetupData = z.infer<typeof productSetupSchema>;

// Partial schema for draft validation (less strict)
export const productDraftSchema = z.object({
  produktnavn: produktnavnSchema.optional(),
  varenummer: varenummerSchema.optional(),
  beskrivelse: beskrivelseSchema,
  eanNummer: eanNummerSchema,
  enhed: enhedSchema.optional(),
  basispris: danishCurrencySchema.optional(),
  discount: discountSchema.optional(),
  kategori: kategoriSchema.optional(),
  lagerstyring: lagerstyringSchema.optional(),
  billeder: z.array(billedeSchema).optional(),
  aktiv: z.boolean().default(true)
});

export type ProductDraftData = z.infer<typeof productDraftSchema>;

// Schema for individual field validation
export const fieldValidationSchemas = {
  produktnavn: produktnavnSchema,
  varenummer: varenummerSchema,
  beskrivelse: beskrivelseSchema,
  eanNummer: eanNummerSchema,
  enhed: enhedSchema,
  basispris: danishCurrencySchema,
  'discount.beforePrice': optionalDanishCurrencySchema,
  'discount.discountPercentage': discountPercentageSchema,
  'discount.discountAmount': optionalDanishCurrencySchema,
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