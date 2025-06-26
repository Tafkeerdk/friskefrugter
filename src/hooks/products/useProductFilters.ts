import { useState, useEffect } from 'react';
import { authService } from '@/lib/auth';

interface Category {
  _id: string;
  navn: string;
}

interface FilterState {
  category: string;
  sort: string;
  search: string;
}

interface UseProductFiltersReturn {
  filters: FilterState;
  categories: Category[];
  isLoadingCategories: boolean;
  updateFilter: (key: keyof FilterState, value: string) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  category: 'all',
  sort: 'produktnavn',
  search: ''
};

const sortOptions = [
  { value: 'produktnavn', label: 'Navn (A-Å)' },
  { value: 'produktnavn-desc', label: 'Navn (Å-A)' },
  { value: 'basispris', label: 'Pris (Lav-Høj)' },
  { value: 'basispris-desc', label: 'Pris (Høj-Lav)' },
  { value: 'createdAt-desc', label: 'Nyeste' },
  { value: 'createdAt', label: 'Ældste' }
];

export function useProductFilters(): UseProductFiltersReturn {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await authService.apiClient.get('/.netlify/functions/categories');
        const data = await response.json();
        
        if (data.success && data.data) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return {
    filters,
    categories,
    isLoadingCategories,
    updateFilter,
    resetFilters
  };
}

export { sortOptions }; 