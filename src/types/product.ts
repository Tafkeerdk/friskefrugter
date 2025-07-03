export interface Unit {
  _id: string;
  value: string;
  label: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductFormData {
  produktnavn: string;
  varenummer?: string;
  beskrivelse?: string;
  eanNummer?: string;
  enhed: string; // Unit ID instead of hardcoded values
  basispris: number;
  // General Product Discount System
  discount: {
    enabled: boolean;
    beforePrice?: number;
    discountPercentage?: number;
    discountAmount?: number;
    eligibleDiscountGroups?: string[];
    eligibleCustomers?: string[];
    showStrikethrough?: boolean;
    discountLabel?: string;
    validFrom?: string;
    validTo?: string;
  };
  kategori: {
    id?: string;
    navn: string;
    isNew?: boolean;
  };
  lagerstyring: {
    enabled: boolean;
    antalPaaLager?: number;
    minimumslager?: number;
  };
  billeder: ProductImage[];
  aktiv: boolean;
}

export interface ProductImage {
  // For new uploads
  file?: File;
  preview?: string;
  compressed?: boolean;
  id?: string;
  isPrimary?: boolean;
  
  // For existing images from database
  _id?: string;
  url?: string;
  filename?: string;
  originalname?: string;
  size?: number;
  uploadedAt?: string;
  
  // Indicates if this is an existing image or new upload
  isExisting?: boolean;
  altText?: string;
}

export interface Category {
  id: string;
  navn: string;
  beskrivelse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  produktnavn: string;
  varenummer?: string;
  beskrivelse?: string;
  eanNummer?: string;
  enhed: Unit; // Changed to Unit object instead of string enum
  basispris: number;
  // General Product Discount System
  discount: {
    enabled: boolean;
    beforePrice?: number;
    discountPercentage?: number;
    discountAmount?: number;
    eligibleDiscountGroups?: string[];
    eligibleCustomers?: string[];
    showStrikethrough?: boolean;
    discountLabel?: string;
    validFrom?: string;
    validTo?: string;
  };
  kategori: Category;
  lagerstyring: {
    enabled: boolean;
    antalPaaLager?: number;
    minimumslager?: number;
  };
  billeder: string[]; // URLs for stored images
  aktiv: boolean;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  formattedPrice?: string;
  formattedBeforePrice?: string;
  discountStatus?: 'none' | 'active' | 'scheduled' | 'expired';
  stockStatus?: 'not_managed' | 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface ProductSetupFormProps {
  initialData?: Partial<ProductFormData>;
  productId?: string; // For edit mode
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  isLoading?: boolean;
}

export interface ProductSetupInterfaceProps {
  productId?: string;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

// Discount Group interface for rabat gruppe preview
export interface DiscountGroup {
  id: string;
  name: string;
  description?: string;
  discountPercentage: number;
  color: string;
  customerCount: number;
  formattedDiscount: string;
}

// Price calculation result for preview
export interface PriceCalculationResult {
  type: 'none' | 'general' | 'group' | 'customer';
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  label?: string;
  groupName?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: ValidationError[];
}

export type UnitOptions = Array<{
  value: 'kg' | 'stk' | 'bakke' | 'kasse';
  label: string;
}>;

export interface ImageUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface OrderSummary {
  _id: string;
  orderNumber: string;
  customer: {
    companyName: string;
    email: string;
    contactPersonName: string;
  };
  status: string;
  statusDisplay: string;
  statusVariant: string;
  totalAmount: number;
  placedAt: string;
  expectedDelivery?: string;
  delivery?: {
    expectedDelivery?: string;
    deliveredAt?: string;
    deliveryTimeSlot?: string;
    isManuallySet?: boolean;
    estimatedRange?: {
      earliest: string;
      latest: string;
      updatedAt: string;
    };
  };
  estimatedRange?: {
    earliest: string;
    latest: string;
    updatedAt: string;
  };
  isInvoiced: boolean;
  invoiceNumber?: string;
  lastUpdated?: string;
  rejectionReason?: string;
  rejectedAt?: string;
} 