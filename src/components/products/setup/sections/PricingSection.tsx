import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Banknote, CheckCircle2, AlertTriangle, DollarSign, Eye, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormData, Unit } from '@/types/product';
import { CurrencyInput } from '../components/CurrencyInput';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface PricingSectionProps {
  form: UseFormReturn<ProductFormData>;
  isLoading: boolean;
  units: Unit[];
  setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
  loadingUnits: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  form,
  isLoading,
  units,
  setUnits,
  loadingUnits
}) => {
  const { toast } = useToast();
  const { formState: { errors }, watch, setValue } = form;
  
  // Unit creation states
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitValue, setNewUnitValue] = useState('');
  const [isCreatingUnit, setIsCreatingUnit] = useState(false);
  const [isCreatingUnitLoading, setIsCreatingUnitLoading] = useState(false);
  const [unitCreationStatus, setUnitCreationStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [unitCreationError, setUnitCreationError] = useState<string | null>(null);

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Handle unit creation
  const handleCreateUnit = async () => {
    if (isCreatingUnitLoading) {
      toast({
        title: 'Vent venligst',
        description: 'Enheden bliver allerede oprettet...',
        variant: 'default',
        duration: 2000,
      });
      return;
    }

    if (!newUnitName.trim() || !newUnitValue.trim()) {
      setUnitCreationError('Både kort værdi og fuldt navn skal udfyldes');
      return;
    }

    try {
      setIsCreatingUnitLoading(true);
      setUnitCreationStatus('creating');
      setUnitCreationError(null);
      
      const response = await api.createUnit({
        value: newUnitValue.trim(),
        label: newUnitName.trim(),
        description: `Brugerdefineret enhed: ${newUnitName.trim()}`,
        sortOrder: 999
      });
      
      if (response.success && response.data) {
        const newUnit = response.data as Unit;
        setUnitCreationStatus('success');
        setUnits([...units, newUnit]);
        setValue('enhed', newUnit._id);
        setNewUnitName('');
        setNewUnitValue('');
        
        setTimeout(() => {
          setIsCreatingUnit(false);
          setUnitCreationStatus('idle');
          setIsCreatingUnitLoading(false);
        }, 1500);
        
        toast({
          title: '✅ Enhed oprettet',
          description: `Enheden "${newUnit.label}" er blevet oprettet succesfuldt.`,
          duration: 3000,
        });
      } else {
        throw new Error(response.error || 'Enheden blev ikke oprettet korrekt');
      }
    } catch (error: any) {
      setUnitCreationStatus('error');
      setUnitCreationError(error.message || 'Kunne ikke oprette enheden. Prøv igen.');
      
      toast({
        title: '❌ Fejl ved oprettelse',
        description: error.message || 'Kunne ikke oprette enheden. Prøv igen.',
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setIsCreatingUnitLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Priser og enheder
        </CardTitle>
        <CardDescription>
          Prissætning og salgsenheder
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Base Price */}
          <FormField
            control={form.control}
            name="basispris"
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                error={errors.basispris?.message}
                disabled={isLoading}
                label="Nuværende pris"
                description="Den aktuelle salgspris for produktet"
              />
            )}
          />

          {/* Unit */}
          <FormField
            control={form.control}
            name="enhed"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Enhed
                  <span className="text-red-500">*</span>
                  {isCreatingUnit && (
                    <Badge variant="secondary" className="ml-2">
                      Opretter ny enhed
                    </Badge>
                  )}
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    if (value === 'create-new') {
                      setIsCreatingUnit(true);
                      setValue('enhed', '');
                    } else {
                      field.onChange(value);
                    }
                  }}
                  value={isCreatingUnit ? 'create-new' : field.value}
                  disabled={isLoading || isCreatingUnit}
                >
                  <FormControl>
                    <SelectTrigger className={cn(
                      isCreatingUnit && "border-green-300 bg-green-50"
                    )}>
                      <SelectValue placeholder="Vælg enhed">
                        {isCreatingUnit 
                          ? "Opretter ny enhed..." 
                          : (units.find(u => u._id === field.value)?.label || 'Vælg enhed')
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingUnits ? (
                      <SelectItem value="loading" disabled>
                        Indlæser enheder...
                      </SelectItem>
                    ) : (
                      <>
                        {units.map((unit) => (
                          <SelectItem key={unit._id} value={unit._id}>
                            {unit.label}
                          </SelectItem>
                        ))}
                        <Separator />
                        <SelectItem value="create-new">
                          + Opret ny enhed
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                {/* Create new unit */}
                {isCreatingUnit && (
                  <div className={cn(
                    "border rounded-lg p-4 mt-3 transition-all duration-300",
                    unitCreationStatus === 'creating' && "bg-blue-50 border-blue-200",
                    unitCreationStatus === 'success' && "bg-green-50 border-green-200",
                    unitCreationStatus === 'error' && "bg-red-50 border-red-200",
                    unitCreationStatus === 'idle' && "bg-green-50 border-green-200"
                  )}>
                    <div className="flex items-center gap-2 mb-3">
                      {unitCreationStatus === 'creating' && (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {unitCreationStatus === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                      {unitCreationStatus === 'error' && (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      {unitCreationStatus === 'idle' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                      
                      <span className={cn(
                        "text-sm font-medium",
                        unitCreationStatus === 'creating' && "text-blue-700",
                        unitCreationStatus === 'success' && "text-green-700",
                        unitCreationStatus === 'error' && "text-red-700",
                        unitCreationStatus === 'idle' && "text-green-700"
                      )}>
                        {unitCreationStatus === 'creating' && "Opretter enhed..."}
                        {unitCreationStatus === 'success' && "✅ Enhed oprettet succesfuldt!"}
                        {unitCreationStatus === 'error' && "❌ Fejl ved oprettelse"}
                        {unitCreationStatus === 'idle' && "Opret ny enhed"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {unitCreationError && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">Fejl</span>
                          </div>
                          <p className="text-sm text-red-700 mt-1">{unitCreationError}</p>
                          <p className="text-xs text-red-600 mt-2">
                            💡 <strong>Løsning:</strong> Kontroller at begge felter er udfyldt korrekt og prøv igen.
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder="Kort værdi (f.eks. ml, cl, dl)"
                          value={newUnitValue}
                          onChange={(e) => {
                            setNewUnitValue(e.target.value.toLowerCase());
                            if (unitCreationError) setUnitCreationError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newUnitName.trim() && newUnitValue.trim() && !isCreatingUnitLoading) {
                                handleCreateUnit();
                              }
                            }
                            if (e.key === 'Escape') {
                              setIsCreatingUnit(false);
                              setNewUnitName('');
                              setNewUnitValue('');
                              setUnitCreationError(null);
                              setUnitCreationStatus('idle');
                            }
                          }}
                          className={cn(
                            "flex-1",
                            unitCreationError && "border-red-500 focus:border-red-500"
                          )}
                          maxLength={10}
                          disabled={isCreatingUnitLoading || unitCreationStatus === 'success'}
                        />
                        <Input
                          placeholder="Fuldt navn (f.eks. Milliliter (ml))"
                          value={newUnitName}
                          onChange={(e) => {
                            setNewUnitName(e.target.value);
                            if (unitCreationError) setUnitCreationError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newUnitName.trim() && newUnitValue.trim() && !isCreatingUnitLoading) {
                                handleCreateUnit();
                              }
                            }
                            if (e.key === 'Escape') {
                              setIsCreatingUnit(false);
                              setNewUnitName('');
                              setNewUnitValue('');
                              setUnitCreationError(null);
                              setUnitCreationStatus('idle');
                            }
                          }}
                          className={cn(
                            "flex-1",
                            unitCreationError && "border-red-500 focus:border-red-500"
                          )}
                          maxLength={50}
                          disabled={isCreatingUnitLoading || unitCreationStatus === 'success'}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateUnit}
                          disabled={
                            !newUnitName.trim() || 
                            !newUnitValue.trim() || 
                            isCreatingUnitLoading || 
                            unitCreationStatus === 'success'
                          }
                          className={cn(
                            "min-w-[100px] transition-all duration-200",
                            unitCreationStatus === 'success' 
                              ? "bg-green-600 hover:bg-green-700" 
                              : "bg-brand-primary hover:bg-brand-primary-hover"
                          )}
                        >
                          {isCreatingUnitLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              <span>Opretter...</span>
                            </div>
                          ) : unitCreationStatus === 'success' ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Oprettet!</span>
                            </div>
                          ) : (
                            'Opret enhed'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsCreatingUnit(false);
                            setNewUnitName('');
                            setNewUnitValue('');
                            setUnitCreationError(null);
                            setUnitCreationStatus('idle');
                          }}
                          disabled={isCreatingUnitLoading}
                          className="min-w-[80px]"
                        >
                          {isCreatingUnitLoading ? 'Vent...' : 'Annuller'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <FormDescription>
                  {isCreatingUnit ? (
                    <div className="space-y-1">
                      {unitCreationStatus === 'idle' && (
                        <span>Indtast kort værdi (f.eks. ml) og fuldt navn (f.eks. Milliliter (ml))</span>
                      )}
                      {unitCreationStatus === 'creating' && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span>Opretter enheden i systemet...</span>
                        </div>
                      )}
                      {unitCreationStatus === 'success' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Enheden blev oprettet og er klar til brug!</span>
                        </div>
                      )}
                      {unitCreationStatus === 'error' && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Der opstod en fejl. Prøv venligst igen.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    "Vælg salgsenheden for produktet eller opret en ny"
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Enhanced Discount Section */}
        <div className="border-t pt-6">
          <div className="space-y-6">
            {/* Discount Toggle */}
            <FormField
              control={form.control}
              name="discount.enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Aktivér produktrabat
                    </FormLabel>
                    <FormDescription>
                      Vis produktet med rabatpris og før/efter priser. 
                      <strong className="text-orange-600"> Bemærk:</strong> Hvis du angiver en før-pris, vil rabatgrupper ikke få yderligere rabat for at undgå dobbelt rabat.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Discount Configuration */}
            {watch('discount.enabled') && (
              <div className="space-y-6 pl-4 border-l-2 border-brand-primary">
                {/* Price Configuration Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-brand-primary-dark flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Priskonfiguration
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Current Price Display */}
                    <div className="bg-brand-gray-50 border border-brand-gray-200 rounded-lg p-4">
                      <FormLabel className="text-sm text-brand-primary-dark font-medium">
                        Nuværende pris
                      </FormLabel>
                      <div className="mt-1">
                        <span className="text-2xl font-bold text-brand-primary">
                          {formatCurrency(watch('basispris') || 0)}
                        </span>
                      </div>
                      <FormDescription className="text-xs mt-1">
                        Dette er den pris kunden betaler
                      </FormDescription>
                    </div>

                    {/* Before Price Input */}
                    <FormField
                      control={form.control}
                      name="discount.beforePrice"
                      render={({ field }) => (
                        <CurrencyInput
                          value={field.value || 0}
                          onChange={field.onChange}
                          error={errors.discount?.beforePrice?.message}
                          disabled={isLoading}
                          label="Før-pris (valgfrit)"
                          description="Oprindelig pris før rabat - skal være højere end nuværende pris"
                          placeholder="0,00"
                          min={0}
                        />
                      )}
                    />
                  </div>

                  {/* Automatic Calculation Display */}
                  {watch('discount.beforePrice') && watch('basispris') && 
                   watch('discount.beforePrice') > watch('basispris') && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Automatisk beregning</span>
                      </div>
                      <div className="text-xs text-green-700">
                        <p>Rabat: {formatCurrency((watch('discount.beforePrice') || 0) - (watch('basispris') || 0))}</p>
                        <p>Rabat procent: {Math.round(((watch('discount.beforePrice') || 0) - (watch('basispris') || 0)) / (watch('discount.beforePrice') || 1) * 100)}%</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Display Options */}
                <div className="space-y-4">
                  <h4 className="font-medium text-brand-primary-dark flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Visningsindstillinger
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Discount Label */}
                    <FormField
                      control={form.control}
                      name="discount.discountLabel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rabat label</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Tilbud"
                              disabled={isLoading}
                              maxLength={50}
                            />
                          </FormControl>
                          <FormDescription>
                            Tekst der vises på rabat-badge (maks 50 tegn)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Show Strikethrough Toggle */}
                    <FormField
                      control={form.control}
                      name="discount.showStrikethrough"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">
                              Vis gennemstregning
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Vis før-prisen med gennemstregning
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Rabat Gruppe Conflict Warning */}
                {watch('discount.beforePrice') && watch('discount.beforePrice') > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Rabatgruppe information</span>
                    </div>
                    <p className="text-xs text-orange-700 mb-2">
                      Da du har angivet en før-pris, vil rabatgrupper <strong>ikke</strong> få yderligere rabat oveni denne produktrabat. 
                      Dette forhindrer dobbelt rabat og sikrer korrekt prisfastsættelse.
                    </p>
                    <div className="text-xs text-orange-600">
                      <p>✓ Rabatgrupper vil se den nuværende pris som deres rabatpris</p>
                      <p>✓ Før-prisen vises med gennemstregning (hvis aktiveret)</p>
                      <p>✓ Ingen yderligere rabat beregnes</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 