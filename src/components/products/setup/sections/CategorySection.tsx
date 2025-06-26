import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormData } from '@/types/product';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface Category {
  _id: string;
  navn: string;
  beskrivelse?: string;
  aktiv: boolean;
  productCount?: number;
}

interface CategorySectionProps {
  form: UseFormReturn<ProductFormData>;
  isLoading: boolean;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  watchedKategori: any;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  form,
  isLoading,
  categories,
  setCategories,
  watchedKategori
}) => {
  const { toast } = useToast();
  const { setValue } = form;
  
  // Category creation states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Handle category creation
  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        const response = await api.createCategory({
          navn: newCategoryName.trim(),
          aktiv: true
        });
        
        if (response.success && response.data) {
          const newCategory = response.data as Category;
          setCategories([...categories, newCategory]);
          setValue('kategori', { id: newCategory._id, navn: newCategory.navn, isNew: true });
          setNewCategoryName('');
          setIsCreatingCategory(false);
          
          toast({
            title: 'Kategori oprettet',
            description: `Kategorien "${newCategory.navn}" er blevet oprettet.`,
            duration: 3000,
          });
        } else {
          toast({
            title: 'Fejl',
            description: 'Kategorien blev ikke oprettet korrekt. Prøv igen.',
            variant: 'destructive',
            duration: 3000,
          });
        }
      } catch (error) {
        toast({
          title: 'Fejl',
          description: 'Kunne ikke oprette kategorien. Prøv igen.',
          variant: 'destructive',
          duration: 3000,
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-5 w-5" />
          Kategori
        </CardTitle>
        <CardDescription>
          Produktkategori og klassificering
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="kategori.navn"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Kategori
                <span className="text-red-500">*</span>
                {isCreatingCategory && (
                  <Badge variant="secondary" className="ml-2">
                    Opretter ny kategori
                  </Badge>
                )}
              </FormLabel>
              <div className="flex gap-2">
                <Select
                  onValueChange={(value) => {
                    if (value === 'create-new') {
                      setIsCreatingCategory(true);
                      setValue('kategori', { navn: '', isNew: true });
                    } else {
                      const category = categories.find(c => c._id === value);
                      if (category) {
                        setValue('kategori', { id: category._id, navn: category.navn, isNew: false });
                      }
                    }
                  }}
                  value={isCreatingCategory ? 'create-new' : (watchedKategori?.id || '')}
                  disabled={isLoading || isCreatingCategory}
                >
                  <FormControl>
                    <SelectTrigger className={cn(
                      "flex-1",
                      isCreatingCategory && "border-blue-300 bg-blue-50"
                    )}>
                      <SelectValue placeholder="Vælg kategori">
                        {isCreatingCategory 
                          ? "Opretter ny kategori..." 
                          : (watchedKategori?.navn || 'Vælg kategori')
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.navn}
                      </SelectItem>
                    ))}
                    <Separator />
                    <SelectItem value="create-new">
                      + Opret ny kategori
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Create new category */}
              {isCreatingCategory && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-700">
                      Opret ny kategori
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Indtast kategori navn (f.eks. Grøntsager, Frugt, Krydderier)"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCategory();
                        }
                        if (e.key === 'Escape') {
                          setIsCreatingCategory(false);
                          setNewCategoryName('');
                          setValue('kategori', { navn: '', isNew: false });
                        }
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Opret
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setNewCategoryName('');
                        setValue('kategori', { navn: '', isNew: false });
                      }}
                    >
                      Annuller
                    </Button>
                  </div>
                </div>
              )}

              <FormDescription>
                {isCreatingCategory 
                  ? "Indtast navnet på den nye kategori og tryk 'Opret'" 
                  : "Vælg en eksisterende kategori eller opret en ny"
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}; 