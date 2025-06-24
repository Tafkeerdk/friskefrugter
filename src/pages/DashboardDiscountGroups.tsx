import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Palette, Percent, Package, Eye, Info, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
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
import { api, handleApiError } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

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

interface Product {
  _id: string;
  produktnavn: string;
  varenummer: string;
  basispris: number;
  førpris?: number; // Sale price - if set, discount groups don't apply
  aktiv: boolean;
  kategori: {
    _id: string;
    navn: string;
  };
  enhed: {
    _id: string;
    label: string;
  };
  billeder?: Array<{
    url: string;
    isPrimary: boolean;
  }>;
}

const DashboardDiscountGroups: React.FC = () => {
  const [discountGroups, setDiscountGroups] = useState<DiscountGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DiscountGroup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Product visibility states - Nielsen's Heuristic #6: Recognition Rather Than Recall
  const [isProductsDialogOpen, setIsProductsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DiscountGroup | null>(null);
  const [discountEligibleProducts, setDiscountEligibleProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsWithSalePrice, setProductsWithSalePrice] = useState(0);
  
  // Customer management states
  const [isCustomersDialogOpen, setIsCustomersDialogOpen] = useState(false);
  const [selectedGroupForCustomers, setSelectedGroupForCustomers] = useState<DiscountGroup | null>(null);
  const [groupCustomers, setGroupCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // Add customer to group state
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [loadingAllCustomers, setLoadingAllCustomers] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  
  // UI feedback states for better UX
  const [previewFormData, setPreviewFormData] = useState({
    name: '',
    description: '',
    discountPercentage: '',
    color: '#6B7280'
  });
  
  // Category filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountPercentage: '',
    color: '#6B7280'
  });

  // Enhanced color options with gradient effects
  const colorOptions = [
    { name: 'Standard', value: '#6B7280', gradient: 'from-gray-400 to-gray-600' },
    { name: 'Safir', value: '#3B82F6', gradient: 'from-blue-400 to-blue-600' },
    { name: 'Smaragd', value: '#10B981', gradient: 'from-emerald-400 to-emerald-600' },
    { name: 'Guld', value: '#F59E0B', gradient: 'from-yellow-400 to-yellow-600' },
    { name: 'Rav', value: '#F97316', gradient: 'from-orange-400 to-orange-600' },
    { name: 'Rubin', value: '#EF4444', gradient: 'from-red-400 to-red-600' },
    { name: 'Ametyst', value: '#8B5CF6', gradient: 'from-violet-400 to-violet-600' },
    { name: 'Diamant', value: '#EC4899', gradient: 'from-pink-400 to-pink-600' },
  ];

  useEffect(() => {
    fetchDiscountGroups();
    loadProductStatistics();
  }, []);

  const fetchDiscountGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.getDiscountGroups();
      
      if (response.success) {
        setDiscountGroups(response.discountGroups as DiscountGroup[] || []);
        console.log('🔄 DashboardDiscountGroups: Fetched', response.discountGroups?.length || 0, 'discount groups');
      } else {
        setError(response.message || 'Kunne ikke hente rabatgrupper');
      }
    } catch (err) {
      setError('Netværksfejl - kontroller din internetforbindelse');
      console.error('Error fetching discount groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to notify other components about discount group changes
  const notifyDiscountGroupUpdate = () => {
    console.log('📢 Broadcasting discount group update event');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('discountGroupsUpdated'));
    
    // Also set localStorage as fallback for cross-tab communication
    localStorage.setItem('discountGroupsUpdated', Date.now().toString());
    
    // Remove the localStorage item after a short delay to avoid constant triggers
    setTimeout(() => {
      localStorage.removeItem('discountGroupsUpdated');
    }, 100);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discountPercentage: '',
      color: '#6B7280'
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
      
      const response = await authService.createDiscountGroup({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        discountPercentage: percentage,
        color: formData.color,
        sortOrder: 0
      });

      if (response.success) {
        toast({
          title: 'Rabatgruppe oprettet',
          description: `${formData.name} er blevet oprettet`,
        });
        
        setIsCreateDialogOpen(false);
        resetForm();
        await fetchDiscountGroups();
        
        // Notify other components about the update
        notifyDiscountGroupUpdate();
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
      
      // Optimistic update for immediate UI feedback
      const updatedGroup = {
        ...editingGroup,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        discountPercentage: percentage,
        color: formData.color,
        formattedDiscount: `${percentage}%`
      };
      
      // Update UI immediately
      setDiscountGroups(prev => 
        prev.map(group => 
          group.id === editingGroup.id ? updatedGroup : group
        )
      );
      
      const response = await authService.updateDiscountGroup(editingGroup.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        discountPercentage: percentage,
        color: formData.color,
        sortOrder: 0
      });

      if (response.success) {
        toast({
          title: 'Rabatgruppe opdateret',
          description: `${formData.name} er blevet opdateret`,
        });
        
        setIsEditDialogOpen(false);
        setEditingGroup(null);
        resetForm();
        // Refresh data to ensure consistency
        await fetchDiscountGroups();
        
        // Notify other components about the update
        notifyDiscountGroupUpdate();
      } else {
        // Revert optimistic update on failure
        await fetchDiscountGroups();
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke opdatere rabatgruppe',
          variant: 'destructive',
        });
      }
    } catch (err) {
      // Revert optimistic update on error
      await fetchDiscountGroups();
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
    // Prevent deletion of Standard group (0% discount group)
    if (group.discountPercentage === 0 || group.name.toLowerCase() === 'standard') {
      toast({
        title: 'Kan ikke slette Standard gruppe',
        description: 'Standard rabatgruppen (0%) kan ikke slettes da den bruges som fallback for alle kunder.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log(`🔄 Deleting discount group: ${group.name} (${group.id})`);
      
      // Optimistic update - remove from UI immediately
      setDiscountGroups(prev => prev.filter(g => g.id !== group.id));
      
      const response = await authService.deleteDiscountGroup(group.id);

      if (response.success) {
        toast({
          title: 'Rabatgruppe slettet',
          description: `${group.name} er blevet slettet. ${group.customerCount > 0 ? 'Kunder er flyttet til Standard gruppen.' : ''}`,
        });
        
        console.log(`✅ Successfully deleted discount group: ${group.name}`);
        
        // Refresh data to ensure consistency and get updated customer counts
        await Promise.all([
          fetchDiscountGroups(),
          loadProductStatistics()
        ]);
        
        // Notify other components about the update
        notifyDiscountGroupUpdate();
      } else {
        // Revert optimistic update on failure
        await fetchDiscountGroups();
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke slette rabatgruppe',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('❌ Error deleting discount group:', err);
      // Revert optimistic update on error
      await fetchDiscountGroups();
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved sletning af rabatgruppe',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (group: DiscountGroup) => {
    setEditingGroup(group);
    const initialFormData = {
      name: group.name,
      description: group.description || '',
      discountPercentage: group.discountPercentage.toString(),
      color: group.color
    };
    setFormData(initialFormData);
    setPreviewFormData(initialFormData); // Initialize preview data
    setIsEditDialogOpen(true);
  };

  // Handle form changes with immediate preview updates
  const handleFormChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setPreviewFormData(newFormData); // Update preview immediately
  };

  const getColorName = (colorValue: string) => {
    const colorOption = colorOptions.find(option => option.value === colorValue);
    return colorOption ? colorOption.name : 'Brugerdefineret';
  };

  const getColorGradient = (colorValue: string) => {
    const colorOption = colorOptions.find(option => option.value === colorValue);
    return colorOption ? colorOption.gradient : 'from-gray-400 to-gray-600';
  };

  // Nielsen's Heuristic #1: Visibility of System Status
  const loadProductStatistics = async () => {
    try {
      console.log('🔄 Loading product statistics...');
      
      // Use the new statistics endpoint for accurate counts
      const [statisticsResponse, eligibleProductsResponse] = await Promise.all([
        api.getProductStatistics(),
        api.getDiscountEligibleProducts({ limit: 1000, activeOnly: true })
      ]);

      if (statisticsResponse.success && statisticsResponse.data) {
        const stats = statisticsResponse.data as any;
        console.log('📊 Product statistics from API:', stats);
        
        setTotalProducts(stats.totalActiveProducts);
        setProductsWithSalePrice(stats.productsWithSalePrice); // Products with førpris (fast udsalgspris)
        
        console.log(`✅ Statistics loaded: ${stats.totalActiveProducts} total, ${stats.productsWithSalePrice} with sale price, ${stats.discountEligibleProducts} discount eligible`);
      }

      if (eligibleProductsResponse.success && eligibleProductsResponse.data) {
        // These are products that CAN be affected by discount groups (no førpris)
        const eligibleProducts = (eligibleProductsResponse.data as any).products || [];
        setDiscountEligibleProducts(eligibleProducts);
        console.log(`📦 Loaded ${eligibleProducts.length} discount eligible products`);
      }
    } catch (error) {
      console.error('❌ Error loading product statistics:', error);
    }
  };

  // Nielsen's Heuristic #6: Recognition Rather Than Recall
  const openProductsDialog = (group: DiscountGroup) => {
    setSelectedGroup(group);
    setSelectedCategory('all'); // Reset category filter
    setIsProductsDialogOpen(true);
  };

  const calculateDiscountedPrice = (basePrice: number, discountPercentage: number) => {
    return basePrice * (1 - discountPercentage / 100);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(price);
  };

  // Customer management functions
  const openCustomersDialog = async (group: DiscountGroup) => {
    setSelectedGroupForCustomers(group);
    setIsCustomersDialogOpen(true);
    setLoadingCustomers(true);
    
    // Reset add customer dialog state
    setIsAddCustomerDialogOpen(false);
    setAllCustomers([]);
    setCustomerSearchTerm('');
    
    try {
      console.log(`🔄 Loading customers for discount group: ${group.name} (${group.id})`);
      
      const response = await authService.getDiscountGroupCustomers(group.id);
      
      if (response.success) {
        setGroupCustomers(response.customers || []);
        console.log(`✅ Loaded ${response.customers?.length || 0} customers for group ${group.name}`);
      } else {
        console.error('❌ Failed to load customers:', response.message);
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke hente kunder for denne rabatgruppe',
          variant: 'destructive',
        });
        setGroupCustomers([]);
      }
    } catch (error) {
      console.error('❌ Error loading customers:', error);
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved hentning af kunder',
        variant: 'destructive',
      });
      setGroupCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleRemoveCustomerFromGroup = async (customerId: string, customerName: string) => {
    if (!selectedGroupForCustomers) return;

    try {
      console.log(`🔄 Removing customer ${customerName} from group ${selectedGroupForCustomers.name}`);
      
      const response = await authService.removeCustomerFromDiscountGroup(customerId, selectedGroupForCustomers.id);
      
      if (response.success) {
        // 1. Update local customer list immediately
        setGroupCustomers(prev => prev.filter(customer => customer.id !== customerId));
        
        // 2. Update the discount group customer count immediately
        setDiscountGroups(prev => prev.map(group => 
          group.id === selectedGroupForCustomers.id 
            ? { ...group, customerCount: Math.max(0, group.customerCount - 1) }
            : group
        ));
        
        // 3. Update the selected group for customers to reflect new count
        setSelectedGroupForCustomers(prev => prev ? {
          ...prev,
          customerCount: Math.max(0, prev.customerCount - 1)
        } : null);
        
        // 4. Show success message
        toast({
          title: 'Kunde flyttet',
          description: `${customerName} er flyttet til Standard rabatgruppen`,
        });
        
        console.log(`✅ Customer ${customerName} removed from group ${selectedGroupForCustomers.name}`);
        
        // 5. Refresh the data from server to ensure consistency (but UI is already updated)
        setTimeout(async () => {
          try {
            await fetchDiscountGroups();
          } catch (error) {
            console.error('Background refresh failed:', error);
          }
        }, 500);
        
      } else {
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke fjerne kunde fra rabatgruppe',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error removing customer from group:', error);
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved fjernelse af kunde',
        variant: 'destructive',
      });
    }
  };

  // Add customer to discount group functions
  const openAddCustomerDialog = async () => {
    setIsAddCustomerDialogOpen(true);
    setLoadingAllCustomers(true);
    setCustomerSearchTerm(''); // Reset search
    
    try {
      console.log('🔄 Loading all customers for adding to discount group');
      const response = await authService.getAllCustomers();
      
      if (response.success && response.customers) {
        // Filter out customers already in the current group (use current state)
        const currentGroupCustomerIds = groupCustomers.map(c => c.id);
        const availableCustomers = response.customers.filter(customer => 
          !currentGroupCustomerIds.includes(customer.id)
        );
        
        setAllCustomers(availableCustomers);
        console.log(`✅ Loaded ${availableCustomers.length} available customers (${response.customers.length} total, ${currentGroupCustomerIds.length} already in group)`);
      } else {
        console.error('❌ Failed to load customers:', response.message);
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke hente kunder',
          variant: 'destructive',
        });
        setAllCustomers([]);
      }
    } catch (error) {
      console.error('❌ Error loading customers:', error);
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved hentning af kunder',
        variant: 'destructive',
      });
      setAllCustomers([]);
    } finally {
      setLoadingAllCustomers(false);
    }
  };

  const handleAddCustomerToGroup = async (customerId: string, customerName: string) => {
    if (!selectedGroupForCustomers) return;
    
    try {
      console.log(`🔄 Adding customer ${customerName} to group ${selectedGroupForCustomers.name}`);
      
      const response = await authService.addCustomerToDiscountGroup(customerId, selectedGroupForCustomers.id);
      
      if (response.success) {
        // 1. Remove customer from available customers list immediately
        setAllCustomers(prev => prev.filter(customer => customer.id !== customerId));
        
        // 2. Find the customer data to add to the group
        const addedCustomer = allCustomers.find(customer => customer.id === customerId);
        if (addedCustomer) {
          // Add customer to current group customers immediately
          setGroupCustomers(prev => [...prev, addedCustomer]);
        }
        
        // 3. Update the discount group customer count immediately
        setDiscountGroups(prev => prev.map(group => 
          group.id === selectedGroupForCustomers.id 
            ? { ...group, customerCount: group.customerCount + 1 }
            : group
        ));
        
        // 4. Update the selected group for customers to reflect new count
        setSelectedGroupForCustomers(prev => prev ? {
          ...prev,
          customerCount: prev.customerCount + 1
        } : null);
        
        // 5. Show success message
        toast({
          title: 'Kunde tilføjet',
          description: `${customerName} er tilføjet til ${selectedGroupForCustomers.name}`,
        });
        
        console.log(`✅ Customer ${customerName} added to group ${selectedGroupForCustomers.name}`);
        
        // 6. Refresh the data from server to ensure consistency (but UI is already updated)
        setTimeout(async () => {
          try {
            await fetchDiscountGroups();
            if (selectedGroupForCustomers) {
              const updatedResponse = await authService.getDiscountGroupCustomers(selectedGroupForCustomers.id);
              if (updatedResponse.success) {
                setGroupCustomers(updatedResponse.customers || []);
              }
            }
          } catch (error) {
            console.error('Background refresh failed:', error);
          }
        }, 500);
        
      } else {
        console.error('❌ Failed to add customer:', response.message);
        toast({
          title: 'Fejl',
          description: response.message || 'Kunne ikke tilføje kunde til rabatgruppe',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error adding customer to group:', error);
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved tilføjelse af kunde',
        variant: 'destructive',
      });
    }
  };

  // Filter customers based on search term
  const filteredCustomers = allCustomers.filter(customer =>
    customer.companyName?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.contactPersonName?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.cvrNumber?.includes(customerSearchTerm)
  );

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
      <div className="dashboard-page-container">
        <div className="content-width">
          {/* Mobile-friendly header section */}
          <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-gray-900">Rabatgrupper</h2>
              <p className="text-sm md:text-base text-brand-gray-600">
                Administrer op til 5 rabatgrupper med forskellige rabatsatser.
              </p>
              {/* Nielsen's Heuristic #1: Visibility of System Status - Mobile optimized */}
              {totalProducts > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm">
                  <span className="flex items-center gap-1 text-brand-success">
                    <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{discountEligibleProducts.length} varer påvirkes af rabatgrupper</span>
                  </span>
                  <span className="flex items-center gap-1 text-brand-warning">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{productsWithSalePrice} varer har fast udsalgspris</span>
                  </span>
                </div>
              )}
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="btn-brand-primary flex items-center gap-2 w-full sm:w-auto min-h-[44px]"
                  disabled={discountGroups.length >= 5}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Opret rabatgruppe</span>
                  <span className="sm:hidden">Opret</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] mx-4">
                <DialogHeader>
                  <DialogTitle>Opret ny rabatgruppe</DialogTitle>
                  <DialogDescription>
                    Opret en ny rabatgruppe med tilpasset rabatsats og farve.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Navn</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="f.eks. Premium, Guldkunde..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beskrivelse (valgfri)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      placeholder="Kort beskrivelse af rabatgruppen..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountPercentage">Rabatprocent</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      min="0"
                      max="50"
                      value={formData.discountPercentage}
                      onChange={(e) => handleFormChange('discountPercentage', e.target.value)}
                      placeholder="f.eks. 15"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Farve</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                      {colorOptions.map((colorOption) => (
                        <button
                          key={colorOption.value}
                          type="button"
                          onClick={() => handleFormChange('color', colorOption.value)}
                          className={`
                            relative h-16 sm:h-12 rounded-lg bg-gradient-to-br ${colorOption.gradient} 
                            shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200
                            ${formData.color === colorOption.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                            touch-manipulation
                          `}
                        >
                          {formData.color === colorOption.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              </div>
                            </div>
                          )}
                          <span className="absolute bottom-1 left-1 right-1 text-xs text-white font-medium text-center bg-black bg-opacity-30 rounded px-1 py-0.5">
                            {colorOption.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    Annuller
                  </Button>
                  <Button 
                    onClick={handleCreate} 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    {isSubmitting ? 'Opretter...' : 'Opret rabatgruppe'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {discountGroups.length === 0 ? (
            <Card className="text-center py-12 mt-6">
              <CardContent>
                <div className="mx-auto w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Percent className="h-8 w-8 text-brand-primary" />
                </div>
                <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">
                  Ingen rabatgrupper endnu
                </h3>
                <p className="text-brand-gray-600 mb-6">
                  Opret din første rabatgruppe for at give forskellige kunder forskellige rabatsatser.
                </p>
                <Button 
                  className="btn-brand-primary min-h-[44px]"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Opret første rabatgruppe
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile-optimized grid layout with better spacing */}
              <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {discountGroups.map((group) => (
                  <Card key={group.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: group.color }}
                          />
                          <CardTitle className="text-lg truncate">{group.name}</CardTitle>
                        </div>
                        <Badge 
                          variant="secondary"
                          className="text-lg font-bold px-3 py-1"
                          style={{ backgroundColor: `${group.color}20`, color: group.color }}
                        >
                          {group.discountPercentage}%
                        </Badge>
                      </div>
                      {group.description && (
                        <CardDescription className="mt-2">{group.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span>{group.customerCount} kunde(r)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Palette className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{getColorName(group.color)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Percent className="h-4 w-4 flex-shrink-0" />
                          <span>{group.discountPercentage}% rabat</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-4 w-4 flex-shrink-0" />
                          <span>{discountEligibleProducts.length} påvirkede varer</span>
                        </div>
                      </div>
                      
                      {/* Mobile-friendly button layout with proper spacing */}
                      <div className="pt-4 border-t space-y-3">
                        {/* Primary action buttons - stacked on mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            onClick={() => openCustomersDialog(group)}
                            className="text-brand-primary hover:text-brand-primary-hover border-brand-primary/30 hover:border-brand-primary min-h-[44px] touch-manipulation"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Se kunder ({group.customerCount})
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => openProductsDialog(group)}
                            className="text-brand-primary hover:text-brand-primary-hover border-brand-primary/30 hover:border-brand-primary min-h-[44px] touch-manipulation"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Se varer ({discountEligibleProducts.length})
                          </Button>
                        </div>
                        
                        {/* Secondary actions - grid layout for better spacing */}
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(group)}
                            className="min-h-[44px] touch-manipulation"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Rediger</span>
                            <span className="sm:hidden">Ret</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 min-h-[44px] touch-manipulation"
                                disabled={group.discountPercentage === 0 || group.name.toLowerCase() === 'standard'}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Slet</span>
                                <span className="sm:hidden">Slet</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="mx-4">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Denne handling kan ikke fortrydes. Rabatgruppen "{group.name}" vil blive slettet permanent.
                                  {group.customerCount > 0 && (
                                    <span className="block mt-2 text-blue-600 font-medium">
                                      Alle kunder i denne gruppe vil blive flyttet til Standard rabatgruppen.
                                    </span>
                                  )}
                                  {(group.discountPercentage === 0 || group.name.toLowerCase() === 'standard') && (
                                    <span className="block mt-2 text-red-600 font-medium">
                                      Standard rabatgruppen kan ikke slettes da den bruges som fallback.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
                                <AlertDialogCancel className="w-full sm:w-auto min-h-[44px]">
                                  Annuller
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(group)}
                                  className="w-full sm:w-auto min-h-[44px] bg-red-600 hover:bg-red-700"
                                  disabled={group.discountPercentage === 0 || group.name.toLowerCase() === 'standard'}
                                >
                                  Slet rabatgruppe
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {discountGroups.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                <Percent className="h-8 w-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">
                Ingen rabatgrupper endnu
              </h3>
              <p className="text-brand-gray-600 mb-6">
                Opret din første rabatgruppe for at give forskellige kunder forskellige rabatsatser.
              </p>
              <Button 
                className="btn-brand-primary min-h-[44px]"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Opret første rabatgruppe
              </Button>
            </div>
          )}

          {/* Mobile-optimized status alert */}
          {totalProducts > 0 && (
            <Alert className="mt-6 border-brand-primary/30 bg-brand-primary/5">
              <Info className="h-4 w-4 text-brand-primary" />
              <AlertDescription className="text-brand-gray-700">
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="font-medium">Produktoversigt:</span>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-brand-success" />
                        {discountEligibleProducts.length} påvirket af rabatgrupper
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-brand-warning" />
                        {productsWithSalePrice} med fast udsalgspris
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-brand-gray-500">
                    💡 Rabatgrupper påvirker kun produkter uden fast udsalgspris (førpris). Når et produkt har en udsalgspris, slås rabatgruppen fra.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Products Dialog - Nielsen's Heuristic #6: Recognition Rather Than Recall */}
      <Dialog open={isProductsDialogOpen} onOpenChange={setIsProductsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedGroup?.color }}
              />
              <span>Varer påvirket af "{selectedGroup?.name}"</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Disse varer får {selectedGroup?.discountPercentage}% rabat. Produkter med før-pris påvirkes ikke.
            </DialogDescription>
            
            {/* CATEGORY FILTER */}
            {discountEligibleProducts.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-gray-600">Filtrer kategori:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="all">Alle kategorier</option>
                  {[...new Set(discountEligibleProducts.map(p => p.kategori.navn))].sort().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingProducts ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
                  <p className="mt-2 text-brand-gray-600">Henter produkter...</p>
                </div>
              </div>
            ) : discountEligibleProducts.length > 0 ? (
              <div className="space-y-6 p-1">
                {/* CLEAR CATEGORY GROUPING */}
                {Object.entries(
                  discountEligibleProducts
                    .filter(product => selectedCategory === 'all' || product.kategori.navn === selectedCategory)
                    .reduce((acc, product) => {
                      const categoryName = product.kategori.navn;
                      if (!acc[categoryName]) {
                        acc[categoryName] = [];
                      }
                      acc[categoryName].push(product);
                      return acc;
                    }, {} as Record<string, typeof discountEligibleProducts>)
                ).sort(([a], [b]) => a.localeCompare(b)).map(([categoryName, products]) => (
                  <div key={categoryName} className="bg-gray-50 rounded-lg p-4">
                    {/* PROMINENT CATEGORY HEADER */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-brand-primary/20">
                      <h3 className="text-lg font-bold text-brand-primary">
                        📦 {categoryName}
                      </h3>
                      <span className="bg-brand-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                        {products.length} varer
                      </span>
                    </div>
                    
                    {/* CLEAN PRODUCT GRID - NO TEXT OVERLAPPING */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {products.map((product) => (
                        <div key={product._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex gap-3">
                            {/* PRODUCT IMAGE WITH FALLBACK */}
                            <div className="w-16 h-16 flex-shrink-0 rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                              {product.billeder && product.billeder.length > 0 ? (
                                <img
                                  src={product.billeder.find(img => img.isPrimary)?.url || product.billeder[0]?.url}
                                  alt={product.produktnavn}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Replace broken image with placeholder
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const placeholder = target.nextElementSibling as HTMLElement;
                                    if (placeholder) placeholder.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              {/* DEFAULT PLACEHOLDER */}
                              <div 
                                className={`w-full h-full flex items-center justify-center bg-gray-100 ${
                                  product.billeder && product.billeder.length > 0 ? 'hidden' : 'flex'
                                }`}
                                style={{ display: product.billeder && product.billeder.length > 0 ? 'none' : 'flex' }}
                              >
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            </div>
                            
                            {/* PRODUCT INFO - WELL SPACED */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                                {product.produktnavn}
                              </h4>
                              <p className="text-xs text-gray-500 font-mono">
                                {product.varenummer}
                              </p>
                              
                              {/* PRICING INFO - CLEAR LAYOUT */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Basispris:</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatPrice(product.basispris)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center bg-green-50 px-2 py-1 rounded">
                                  <span className="text-xs text-green-700 font-medium">
                                    Med {selectedGroup?.discountPercentage}% rabat:
                                  </span>
                                  <span className="text-sm font-bold text-green-700">
                                    {formatPrice(calculateDiscountedPrice(product.basispris, selectedGroup?.discountPercentage || 0))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* SUMMARY SECTION */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">
                      📊 {selectedCategory === 'all' ? 'Total påvirkede varer' : `Varer i ${selectedCategory}`}:
                    </span>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold">
                      {selectedCategory === 'all' 
                        ? discountEligibleProducts.length 
                        : discountEligibleProducts.filter(p => p.kategori.navn === selectedCategory).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-gray-700 mb-2">
                  Ingen påvirkede varer
                </h3>
                <p className="text-brand-gray-500 text-sm">
                  Alle produkter har enten før-pris eller er ikke aktive.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 flex justify-end pt-4 border-t bg-white">
            <Button
              variant="outline"
              onClick={() => setIsProductsDialogOpen(false)}
              className="px-6"
            >
              Luk
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Mobile Optimized with Live Preview */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] mx-4">
          <DialogHeader>
            <DialogTitle>Rediger rabatgruppe</DialogTitle>
            <DialogDescription>
              Rediger rabatgruppens indstillinger. Se live preview til højre.
            </DialogDescription>
          </DialogHeader>
          
          {/* Live Preview Card */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <div className="text-sm font-medium text-gray-700 mb-2">👁️ Live Preview:</div>
            <div className="bg-white rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full transition-all duration-200"
                    style={{ backgroundColor: previewFormData.color }}
                  />
                  <span className="font-medium text-sm">
                    {previewFormData.name || 'Navn...'}
                  </span>
                </div>
                <span 
                  className="text-sm font-bold px-2 py-1 rounded transition-all duration-200"
                  style={{ 
                    backgroundColor: `${previewFormData.color}20`, 
                    color: previewFormData.color 
                  }}
                >
                  {previewFormData.discountPercentage || '0'}%
                </span>
              </div>
              {previewFormData.description && (
                <div className="text-xs text-gray-500 mt-1">
                  {previewFormData.description}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Navn</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="f.eks. Premium, Guldkunde..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beskrivelse (valgfri)</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Kort beskrivelse af rabatgruppen..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-discountPercentage">Rabatprocent</Label>
              <Input
                id="edit-discountPercentage"
                type="number"
                min="0"
                max="50"
                value={formData.discountPercentage}
                onChange={(e) => handleFormChange('discountPercentage', e.target.value)}
                placeholder="f.eks. 15"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Farve</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => handleFormChange('color', colorOption.value)}
                    className={`
                      relative h-16 sm:h-12 rounded-lg bg-gradient-to-br ${colorOption.gradient} 
                      shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200
                      ${formData.color === colorOption.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                      touch-manipulation
                    `}
                  >
                    {formData.color === colorOption.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 right-1 text-xs text-white font-medium text-center bg-black bg-opacity-30 rounded px-1 py-0.5">
                      {colorOption.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingGroup(null);
                resetForm();
              }}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Annuller
            </Button>
            <Button 
              onClick={handleEdit} 
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {isSubmitting ? 'Opdaterer...' : 'Gem ændringer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Management Dialog */}
      <Dialog open={isCustomersDialogOpen} onOpenChange={setIsCustomersDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedGroupForCustomers?.color }}
                  />
                  <span>Kunder i "{selectedGroupForCustomers?.name}"</span>
                </DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Administrer kunder i denne rabatgruppe. Kunder får {selectedGroupForCustomers?.discountPercentage}% rabat.
                </DialogDescription>
              </div>
              <Button
                onClick={openAddCustomerDialog}
                className="btn-brand-primary ml-4 min-h-[40px]"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tilføj kunde
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingCustomers ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
                  <p className="mt-2 text-brand-gray-600">Henter kunder...</p>
                </div>
              </div>
            ) : groupCustomers.length > 0 ? (
              <div className="space-y-4 p-1">
                {/* Customer List */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-brand-primary/20">
                    <h3 className="text-lg font-bold text-brand-primary">
                      👥 Kunder i gruppen
                    </h3>
                    <span className="bg-brand-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                      {groupCustomers.length} kunder
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {groupCustomers.map((customer) => (
                      <div key={customer.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 space-y-2">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {customer.companyName}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{customer.contactPersonName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>📧</span>
                                <span className="truncate">{customer.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>📞</span>
                                <span>{customer.phone}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>🏢</span>
                                <span>CVR: {customer.cvrNumber}</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              Tilmeldt: {new Date(customer.createdAt).toLocaleDateString('da-DK')}
                            </div>
                          </div>
                          
                          {/* Customer Actions */}
                          <div className="flex-shrink-0 ml-3">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 min-h-[36px]"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Fjern
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="mx-4">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Fjern kunde fra rabatgruppe?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Er du sikker på at du vil fjerne "{customer.companyName}" fra rabatgruppen "{selectedGroupForCustomers?.name}"?
                                    <span className="block mt-2 text-blue-600 font-medium">
                                      Kunden vil blive flyttet til Standard rabatgruppen (0% rabat).
                                    </span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
                                  <AlertDialogCancel className="w-full sm:w-auto min-h-[44px]">
                                    Annuller
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveCustomerFromGroup(customer.id, customer.companyName)}
                                    className="w-full sm:w-auto min-h-[44px] bg-red-600 hover:bg-red-700"
                                  >
                                    Fjern kunde
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Summary */}

              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-gray-700 mb-2">
                  Ingen kunder i denne gruppe
                </h3>
                <p className="text-brand-gray-500 text-sm mb-4">
                  Denne rabatgruppe har ingen kunder endnu.
                </p>
                <p className="text-xs text-gray-500">
                  💡 Gå til Kunder-siden for at tildele kunder til denne rabatgruppe.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 flex justify-end pt-4 border-t bg-white">
            <Button
              variant="outline"
              onClick={() => setIsCustomersDialogOpen(false)}
              className="px-6"
            >
              Luk
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Customer to Group Dialog */}
      <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-brand-primary" />
              <span>Tilføj kunde til "{selectedGroupForCustomers?.name}"</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Vælg en kunde at tilføje til denne rabatgruppe. Kunden vil få {selectedGroupForCustomers?.discountPercentage}% rabat.
            </DialogDescription>
            
            {/* Search Box */}
            <div className="pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Søg efter virksomhed, kontaktperson, email eller CVR..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingAllCustomers ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
                  <p className="mt-2 text-brand-gray-600">Henter kunder...</p>
                </div>
              </div>
            ) : filteredCustomers.length > 0 ? (
              <div className="space-y-3 p-1">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 space-y-2">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {customer.companyName}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{customer.contactPersonName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>📧</span>
                            <span className="truncate">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>📞</span>
                            <span>{customer.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>🏢</span>
                            <span>CVR: {customer.cvrNumber}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Tilmeldt: {new Date(customer.createdAt).toLocaleDateString('da-DK')}
                        </div>
                      </div>
                      
                      {/* Add Customer Button */}
                      <div className="flex-shrink-0 ml-3">
                        <Button
                          onClick={() => handleAddCustomerToGroup(customer.id, customer.companyName)}
                          className="btn-brand-primary min-h-[36px]"
                          size="sm"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Tilføj
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !loadingAllCustomers && customerSearchTerm ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-gray-700 mb-2">
                  Ingen kunder fundet
                </h3>
                <p className="text-brand-gray-500 text-sm">
                  Ingen kunder matcher din søgning "{customerSearchTerm}".
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-gray-700 mb-2">
                  Ingen tilgængelige kunder
                </h3>
                <p className="text-brand-gray-500 text-sm">
                  Alle kunder er enten allerede i denne rabatgruppe eller der er ingen kunder at tilføje.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t bg-white">
            <div className="text-sm text-gray-600">
              {filteredCustomers.length} tilgængelige kunder
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCustomerDialogOpen(false);
                setCustomerSearchTerm('');
                setAllCustomers([]);
              }}
              className="px-6"
            >
              Luk
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardDiscountGroups;