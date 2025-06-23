import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Palette, Percent } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';

interface DiscountGroup {
  id: string;
  name: string;
  description?: string;
  discountPercentage: number;
  isActive: boolean;
  sortOrder: number;
  color: string;
  customerCount: number;
  formattedDiscount: string;
  createdBy?: {
    name: string;
    email: string;
  };
  updatedBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const DashboardDiscountGroups: React.FC = () => {
  const [discountGroups, setDiscountGroups] = useState<DiscountGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DiscountGroup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountPercentage: '',
    color: '#6B7280',
    sortOrder: 0
  });

  // Color options for discount groups
  const colorOptions = [
    { name: 'Grå', value: '#6B7280' },
    { name: 'Blå', value: '#3B82F6' },
    { name: 'Grøn', value: '#10B981' },
    { name: 'Gul', value: '#F59E0B' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Rød', value: '#EF4444' },
    { name: 'Lilla', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
  ];

  useEffect(() => {
    fetchDiscountGroups();
  }, []);

  const fetchDiscountGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.apiClient.get('/admin/discount-groups');
      
      if (response.success) {
        setDiscountGroups(response.discountGroups || []);
      } else {
        setError(response.message || 'Kunne ikke hente rabatgrupper');
      }
    } catch (err) {
      setError('Der opstod en fejl ved hentning af rabatgrupper');
      console.error('Error fetching discount groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discountPercentage: '',
      color: '#6B7280',
      sortOrder: 0
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.discountPercentage) {
      toast({
        title: 'Manglende felter',
        description: 'Navn og rabat procent er påkrævet',
        variant: 'destructive',
      });
      return;
    }

    const percentage = parseFloat(formData.discountPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast({
        title: 'Ugyldig rabat',
        description: 'Rabat procent skal være mellem 0 og 100',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await authService.apiClient.post('/admin/discount-groups', {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        discountPercentage: percentage,
        color: formData.color,
        sortOrder: formData.sortOrder
      });

      if (response.success) {
        toast({
          title: 'Rabatgruppe oprettet',
          description: `${formData.name} er blevet oprettet`,
        });
        
        setIsCreateDialogOpen(false);
        resetForm();
        await fetchDiscountGroups();
      } else {
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke oprette rabatgruppe',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved oprettelse af rabatgruppe',
        variant: 'destructive',
      });
      console.error('Error creating discount group:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingGroup || !formData.name.trim() || !formData.discountPercentage) {
      toast({
        title: 'Manglende felter',
        description: 'Navn og rabat procent er påkrævet',
        variant: 'destructive',
      });
      return;
    }

    const percentage = parseFloat(formData.discountPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast({
        title: 'Ugyldig rabat',
        description: 'Rabat procent skal være mellem 0 og 100',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await authService.apiClient.put('/admin/discount-groups', {
        discountGroupId: editingGroup.id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        discountPercentage: percentage,
        color: formData.color,
        sortOrder: formData.sortOrder
      });

      if (response.success) {
        toast({
          title: 'Rabatgruppe opdateret',
          description: `${formData.name} er blevet opdateret`,
        });
        
        setIsEditDialogOpen(false);
        setEditingGroup(null);
        resetForm();
        await fetchDiscountGroups();
      } else {
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke opdatere rabatgruppe',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved opdatering af rabatgruppe',
        variant: 'destructive',
      });
      console.error('Error updating discount group:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (group: DiscountGroup) => {
    try {
      const response = await authService.apiClient.delete('/admin/discount-groups', {
        discountGroupId: group.id
      });

      if (response.success) {
        toast({
          title: 'Rabatgruppe slettet',
          description: `${group.name} er blevet slettet`,
        });
        
        await fetchDiscountGroups();
      } else {
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke slette rabatgruppe',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved sletning af rabatgruppe',
        variant: 'destructive',
      });
      console.error('Error deleting discount group:', err);
    }
  };

  const openEditDialog = (group: DiscountGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      discountPercentage: group.discountPercentage.toString(),
      color: group.color,
      sortOrder: group.sortOrder
    });
    setIsEditDialogOpen(true);
  };

  const getColorName = (colorValue: string) => {
    const colorOption = colorOptions.find(option => option.value === colorValue);
    return colorOption ? colorOption.name : 'Brugerdefineret';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Henter rabatgrupper...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rabatgrupper</h2>
          <p className="text-muted-foreground">
            Administrer op til 5 rabatgrupper med forskellige rabatsatser.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="flex items-center gap-2"
              disabled={discountGroups.length >= 5}
            >
              <Plus className="h-4 w-4" />
              <span>Opret rabatgruppe</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opret ny rabatgruppe</DialogTitle>
              <DialogDescription>
                Opret en ny rabatgruppe med tilpasset navn og rabatsats.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="f.eks. Premium Kunder"
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Valgfri beskrivelse af rabatgruppen"
                  maxLength={200}
                />
              </div>
              <div>
                <Label htmlFor="discountPercentage">Rabat procent * (%)</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                  placeholder="f.eks. 15.5"
                />
              </div>
              <div>
                <Label htmlFor="color">Farve</Label>
                <div className="flex gap-2 mt-2">
                  {colorOptions.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === colorOption.value ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: colorOption.value }}
                      onClick={() => setFormData({...formData, color: colorOption.value})}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="sortOrder">Sorteringsrækkefølge</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Annuller
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Opretter...' : 'Opret rabatgruppe'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {discountGroups.length >= 5 && (
        <Alert className="mt-6">
          <AlertDescription>
            Du har nået maksimum antal rabatgrupper (5). Slet en eksisterende gruppe for at oprette en ny.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {discountGroups.map((group) => (
          <Card key={group.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                </div>
                <Badge 
                  variant="secondary"
                  className="text-lg font-bold"
                  style={{ backgroundColor: `${group.color}20`, color: group.color }}
                >
                  {group.formattedDiscount}
                </Badge>
              </div>
              {group.description && (
                <CardDescription>{group.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{group.customerCount} kunde(r)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Palette className="h-4 w-4" />
                  <span>{getColorName(group.color)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Percent className="h-4 w-4" />
                  <span>{group.discountPercentage}% rabat</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(group)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Rediger
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      disabled={group.customerCount > 0}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Slet
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Slet rabatgruppe</AlertDialogTitle>
                      <AlertDialogDescription>
                        Er du sikker på, at du vil slette rabatgruppen "{group.name}"? 
                        Denne handling kan ikke fortrydes.
                        {group.customerCount > 0 && (
                          <span className="block mt-2 text-red-600 font-medium">
                            Denne gruppe kan ikke slettes, da {group.customerCount} kunde(r) bruger den.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuller</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(group)}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={group.customerCount > 0}
                      >
                        Slet rabatgruppe
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {discountGroups.length === 0 && (
        <Card className="mt-6">
          <CardContent className="text-center py-8">
            <Percent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen rabatgrupper endnu</h3>
            <p className="text-muted-foreground mb-4">
              Opret din første rabatgruppe for at begynde at tildele forskellige rabatsatser til dine kunder.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Opret din første rabatgruppe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger rabatgruppe</DialogTitle>
            <DialogDescription>
              Rediger rabatgruppens indstillinger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Navn *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="f.eks. Premium Kunder"
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beskrivelse</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Valgfri beskrivelse af rabatgruppen"
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="edit-discountPercentage">Rabat procent * (%)</Label>
              <Input
                id="edit-discountPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                placeholder="f.eks. 15.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Farve</Label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === colorOption.value ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: colorOption.value }}
                    onClick={() => setFormData({...formData, color: colorOption.value})}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-sortOrder">Sorteringsrækkefølge</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                min="0"
                value={formData.sortOrder}
                onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingGroup(null);
                resetForm();
              }}
            >
              Annuller
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? 'Opdaterer...' : 'Gem ændringer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardDiscountGroups; 