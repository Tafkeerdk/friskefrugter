export interface ProductFormData {
  produktnavn: string;
  beskrivelse?: string;
  eanNummer?: string;
  enhed: 'kg' | 'stk' | 'bakke' | 'kasse';
  basispris: number;
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
  beskrivelse?: string;
  eanNummer?: string;
  enhed: 'kg' | 'stk' | 'bakke' | 'kasse';
  basispris: number;
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
}

export interface ProductSetupFormProps {
  initialData?: Partial<ProductFormData>;
  productId?: string; // For edit mode
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  isLoading?: boolean;
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