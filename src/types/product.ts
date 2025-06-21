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
  file: File;
  preview: string;
  compressed: boolean;
  id?: string;
  isPrimary?: boolean;
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