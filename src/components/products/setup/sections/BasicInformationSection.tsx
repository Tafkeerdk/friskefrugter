import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormData } from '@/types/product';
import { EANInput } from '../components/EANInput';
import { VarenummerInput } from '../components/VarenummerInput';

interface BasicInformationSectionProps {
  form: UseFormReturn<ProductFormData>;
  isLoading: boolean;
  productId?: string;
}

// Character counter component
const CharacterCounter: React.FC<{ current: number; max: number }> = ({ current, max }) => (
  <div className={cn(
    'text-xs text-right',
    current > max * 0.8 ? 'text-amber-600' : 'text-muted-foreground',
    current > max && 'text-red-600'
  )}>
    {current}/{max}
  </div>
);

export const BasicInformationSection: React.FC<BasicInformationSectionProps> = ({
  form,
  isLoading,
  productId
}) => {
  const { formState: { errors } } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Grundlæggende oplysninger
        </CardTitle>
        <CardDescription>
          Produktnavn, beskrivelse og identifikation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Name */}
        <FormField
          control={form.control}
          name="produktnavn"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Produktnavn
                <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="f.eks. Økologiske æbler"
                  disabled={isLoading}
                  className={cn(errors.produktnavn && 'border-red-500')}
                />
              </FormControl>
              <div className="flex justify-between items-center">
                <FormDescription>
                  Kort og beskrivende navn på produktet
                </FormDescription>
                <CharacterCounter current={field.value?.length || 0} max={100} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Varenummer */}
        <FormField
          control={form.control}
          name="varenummer"
          render={({ field }) => (
            <VarenummerInput
              value={field.value}
              onChange={field.onChange}
              error={errors.varenummer?.message}
              disabled={isLoading}
              productId={productId}
            />
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="beskrivelse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivelse (valgfrit)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Detaljeret beskrivelse af produktet..."
                  disabled={isLoading}
                  className="min-h-[100px] resize-y"
                />
              </FormControl>
              <div className="flex justify-between items-center">
                <FormDescription>
                  Uddybende beskrivelse af produktet
                </FormDescription>
                <CharacterCounter current={field.value?.length || 0} max={1000} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* EAN Number */}
        <FormField
          control={form.control}
          name="eanNummer"
          render={({ field }) => (
            <EANInput
              value={field.value}
              onChange={field.onChange}
              error={errors.eanNummer?.message}
              disabled={isLoading}
            />
          )}
        />
      </CardContent>
    </Card>
  );
}; 