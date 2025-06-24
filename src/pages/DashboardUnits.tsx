import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Scale,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api, handleApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Unit {
  _id: string;
  value: string;
  label: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  _id: string;
  produktnavn: string;
  varenummer: string;
  basispris: number;
  aktiv: boolean;
  kategori: {
    _id: string;
    navn: string;
  };
}

const DashboardUnits: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [unitProducts, setUnitProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProductsDialogOpen, setIsProductsDialogOpen] = useState(false);
  
  // Form states
  const [unitForm, setUnitForm] = useState({
    value: '',
    label: '',
    description: '',
    isActive: true,
    sortOrder: 0
  });
  
  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'creating' | 'updating' | 'deleting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadUnits();
  }, [showInactive]);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const response = await api.getUnits();
      
      if (response.success && response.data) {
        let unitsData = response.data as Unit[];
        
        // Get product counts for each unit
        const unitsWithCounts = await Promise.all(
          unitsData.map(async (unit) => {
            try {
              const productsResponse = await api.getUnitProducts(unit._id, {
                limit: 1
              });
              
              return {
                ...unit,
                productCount: (productsResponse.data as any)?.totalProducts || 0
              };
            } catch (error) {
              return {
                ...unit,
                productCount: 0
              };
            }
          })
        );
        
        const filteredUnits = showInactive ? unitsWithCounts : unitsWithCounts.filter(unit => unit.isActive);
        setUnits(filteredUnits);
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast({
        title: 'Fejl',
        description: apiError.message,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUnitProducts = async (unitId: string) => {
    try {
      setLoadingProducts(true);
      const response = await api.getUnitProducts(unitId, {
        limit: 50,
        activeOnly: false
      });
      
      if (response.success && response.data) {
        const data = response.data as any;
        setUnitProducts(data.products || []);
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast({
        title: 'Fejl',
        description: apiError.message,
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCreateUnit = async () => {
    if (!unitForm.value.trim() || !unitForm.label.trim()) {
      setSubmitError('Værdi og label er påkrævet');
      return;
    }
    
    const existingUnit = units.find(unit => 
      unit.value.toLowerCase() === unitForm.value.toLowerCase().trim()
    );
    
    if (existingUnit) {
      setSubmitError('En enhed med denne værdi eksisterer allerede');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus('creating');
      setSubmitError(null);
      
      const response = await api.createUnit({
        value: unitForm.value.toLowerCase().trim(),
        label: unitForm.label.trim(),
        description: unitForm.description.trim() || undefined,
        sortOrder: unitForm.sortOrder
      });
      
      if (response.success) {
        setSubmitStatus('success');
        toast({
          title: '✅ Enhed oprettet succesfuldt!',
          description: `Enheden "${unitForm.label}" blev oprettet.`,
          duration: 3000,
        });
        
        setIsCreateDialogOpen(false);
        resetForm();
        loadUnits();
      }
    } catch (error) {
      setSubmitStatus('error');
      const apiError = handleApiError(error);
      setSubmitError(apiError.message);
      toast({
        title: 'Fejl ved oprettelse',
        description: apiError.message,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus('idle'), 2000);
    }
  };

  const handleUpdateUnit = async () => {
    if (!selectedUnit || !unitForm.value.trim() || !unitForm.label.trim()) {
      setSubmitError('Værdi og label er påkrævet');
      return;
    }
    
    const existingUnit = units.find(unit => 
      unit._id !== selectedUnit._id && 
      unit.value.toLowerCase() === unitForm.value.toLowerCase().trim()
    );
    
    if (existingUnit) {
      setSubmitError('En enhed med denne værdi eksisterer allerede');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus('updating');
      setSubmitError(null);
      
      const response = await api.updateUnit(selectedUnit._id, {
        value: unitForm.value.toLowerCase().trim(),
        label: unitForm.label.trim(),
        description: unitForm.description.trim() || undefined,
        isActive: unitForm.isActive,
        sortOrder: unitForm.sortOrder
      });
      
      if (response.success) {
        setSubmitStatus('success');
        toast({
          title: '✅ Enhed opdateret succesfuldt!',
          description: `Enheden "${unitForm.label}" blev opdateret.`,
          duration: 3000,
        });
        
        setIsEditDialogOpen(false);
        setSelectedUnit(null);
        resetForm();
        loadUnits();
      }
    } catch (error) {
      setSubmitStatus('error');
      const apiError = handleApiError(error);
      setSubmitError(apiError.message);
      toast({
        title: 'Fejl ved opdatering',
        description: apiError.message,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus('idle'), 2000);
    }
  };

  const handleDeleteUnit = async () => {
    if (!selectedUnit) return;
    
    try {
      setIsSubmitting(true);
      setSubmitStatus('deleting');
      setSubmitError(null);
      
      const response = await api.deleteUnit(selectedUnit._id);
      
      if (response.success) {
        setSubmitStatus('success');
        toast({
          title: '✅ Enhed slettet succesfuldt!',
          description: `Enheden "${selectedUnit.label}" og alle tilknyttede produkter blev slettet.`,
          duration: 4000,
        });
        
        setIsDeleteDialogOpen(false);
        setSelectedUnit(null);
        loadUnits();
      }
    } catch (error) {
      setSubmitStatus('error');
      const apiError = handleApiError(error);
      setSubmitError(apiError.message);
      toast({
        title: 'Fejl ved sletning',
        description: apiError.message,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus('idle'), 2000);
    }
  };

  const resetForm = () => {
    setUnitForm({
      value: '',
      label: '',
      description: '',
      isActive: true,
      sortOrder: 0
    });
    setSubmitError(null);
    setSubmitStatus('idle');
  };

  const openEditDialog = (unit: Unit) => {
    setSelectedUnit(unit);
    setUnitForm({
      value: unit.value,
      label: unit.label,
      description: unit.description || '',
      isActive: unit.isActive,
      sortOrder: unit.sortOrder
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsDeleteDialogOpen(true);
  };

  const openProductsDialog = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsProductsDialogOpen(true);
    loadUnitProducts(unit._id);
  };

  const filteredUnits = units.filter(unit =>
    unit.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.description && unit.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(price);
  };

  const getStatusIcon = () => {
    switch (submitStatus) {
      case 'creating':
        return <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />;
      case 'updating':
        return <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />;
      case 'deleting':
        return <Loader2 className="h-4 w-4 animate-spin text-brand-error" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-brand-success" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-brand-error" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (submitStatus) {
      case 'creating':
        return 'Opretter enhed...';
      case 'updating':
        return 'Opdaterer enhed...';
      case 'deleting':
        return 'Sletter enhed og tilknyttede produkter...';
      case 'success':
        return '✅ Enhed behandlet succesfuldt!';
      case 'error':
        return submitError || 'Der opstod en fejl';
      default:
        return '';
    }
  };

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        <div className="content-width space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-brand-gray-900">Enheder</h2>
              <p className="text-brand-gray-600">
                Administrer produktenheder og organiser dit sortiment. Sletning af en enhed vil også slette alle tilknyttede produkter.
              </p>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)} 
              className="btn-brand-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ny enhed
            </Button>
          </div>

          {/* Filters and Search */}
          <Card className="card-brand">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-gray-900">
                <Filter className="h-5 w-5 text-brand-primary" />
                Filtrering og søgning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Søg i enheder..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-brand pl-10"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-inactive"
                    checked={showInactive}
                    onCheckedChange={setShowInactive}
                  />
                  <label htmlFor="show-inactive" className="text-sm font-medium text-brand-gray-700">
                    Vis inaktive enheder
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Units Table */}
          <Card className="card-brand">
            <CardHeader>
              <CardTitle className="text-brand-gray-900">Enhedsoversigt</CardTitle>
              <CardDescription className="text-brand-gray-600">
                {filteredUnits.length} enhed(er) fundet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Indlæser enheder...</span>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-brand-gray-700">Værdi</TableHead>
                      <TableHead className="text-brand-gray-700">Label</TableHead>
                      <TableHead className="text-brand-gray-700">Beskrivelse</TableHead>
                      <TableHead className="text-brand-gray-700">Produkter</TableHead>
                      <TableHead className="text-brand-gray-700">Status</TableHead>
                      <TableHead className="text-brand-gray-700">Oprettet</TableHead>
                      <TableHead className="text-right text-brand-gray-700">Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.map((unit) => (
                      <TableRow key={unit._id}>
                        <TableCell className="font-mono text-sm text-brand-gray-900">{unit.value}</TableCell>
                        <TableCell className="font-medium text-brand-gray-900">{unit.label}</TableCell>
                        <TableCell className="max-w-xs truncate text-brand-gray-600">
                          {unit.description || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-brand-gray-100 text-brand-gray-700">
                              {unit.productCount} produkter
                            </Badge>
                            {unit.productCount > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openProductsDialog(unit)}
                                className="h-6 px-2 hover:bg-brand-gray-100"
                              >
                                <Eye className="h-3 w-3 text-brand-primary" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={unit.isActive ? 'default' : 'secondary'}
                            className={unit.isActive ? 'bg-brand-success text-white' : 'bg-brand-gray-200 text-brand-gray-600'}
                          >
                            {unit.isActive ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-brand-gray-600">{formatDate(unit.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-brand-gray-100">
                                <MoreHorizontal className="h-4 w-4 text-brand-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border-brand-gray-200">
                              <DropdownMenuLabel className="text-brand-gray-900">Handlinger</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => openEditDialog(unit)}
                                className="hover:bg-brand-gray-50 text-brand-gray-700"
                              >
                                <Edit className="mr-2 h-4 w-4 text-brand-primary" />
                                Rediger
                              </DropdownMenuItem>
                              {unit.productCount > 0 && (
                                <DropdownMenuItem 
                                  onClick={() => openProductsDialog(unit)}
                                  className="hover:bg-brand-gray-50 text-brand-gray-700"
                                >
                                  <Package className="mr-2 h-4 w-4 text-brand-primary" />
                                  Se produkter ({unit.productCount})
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-brand-gray-200" />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(unit)}
                                className="hover:bg-brand-error/10 text-brand-error"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Slet enhed og produkter
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUnits.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-brand-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <Scale className="h-8 w-8 text-brand-gray-300" />
                            <span>Ingen enheder fundet</span>
                            {searchTerm && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSearchTerm('')}
                                className="border-brand-gray-300 text-brand-gray-600 hover:bg-brand-gray-50"
                              >
                                Ryd søgning
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Create Unit Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="bg-white border-brand-gray-200">
              <DialogHeader>
                <DialogTitle className="text-brand-gray-900">Opret ny enhed</DialogTitle>
                <DialogDescription className="text-brand-gray-600">
                  Opret en ny produktenhed med værdi og beskrivelse.
                </DialogDescription>
              </DialogHeader>
              
              {submitStatus !== 'idle' && (
                <Alert className={cn(
                  "border-l-4",
                  submitStatus === 'success' ? "border-brand-success bg-brand-success/10" : 
                  submitStatus === 'error' ? "border-brand-error bg-brand-error/10" :
                  "border-brand-primary bg-brand-primary/10"
                )}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <AlertDescription className={cn(
                      submitStatus === 'success' ? "text-brand-success" :
                      submitStatus === 'error' ? "text-brand-error" :
                      "text-brand-primary"
                    )}>
                      {getStatusMessage()}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create-value" className="text-brand-gray-700">Værdi *</Label>
                  <Input
                    id="create-value"
                    value={unitForm.value}
                    onChange={(e) => {
                      setUnitForm({...unitForm, value: e.target.value});
                      setSubmitError(null);
                    }}
                    placeholder="f.eks. kg, stk, liter"
                    className={cn(
                      "input-brand",
                      submitError && !unitForm.value.trim() ? "border-brand-error focus:border-brand-error" : ""
                    )}
                    disabled={isSubmitting}
                  />
                  {submitError && !unitForm.value.trim() && (
                    <p className="text-brand-error text-sm mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Værdi er påkrævet
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="create-label" className="text-brand-gray-700">Label *</Label>
                  <Input
                    id="create-label"
                    value={unitForm.label}
                    onChange={(e) => {
                      setUnitForm({...unitForm, label: e.target.value});
                      setSubmitError(null);
                    }}
                    placeholder="f.eks. Kilogram (kg), Stykker"
                    className={cn(
                      "input-brand",
                      submitError && !unitForm.label.trim() ? "border-brand-error focus:border-brand-error" : ""
                    )}
                    disabled={isSubmitting}
                  />
                  {submitError && !unitForm.label.trim() && (
                    <p className="text-brand-error text-sm mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Label er påkrævet
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="create-description" className="text-brand-gray-700">Beskrivelse</Label>
                  <Textarea
                    id="create-description"
                    value={unitForm.description}
                    onChange={(e) => setUnitForm({...unitForm, description: e.target.value})}
                    placeholder="Valgfri beskrivelse af enheden"
                    className="input-brand"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <Label htmlFor="create-sortOrder" className="text-brand-gray-700">Sorteringsrækkefølge</Label>
                  <Input
                    id="create-sortOrder"
                    type="number"
                    value={unitForm.sortOrder}
                    onChange={(e) => setUnitForm({...unitForm, sortOrder: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="input-brand"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-brand-gray-500 mt-1">
                    Lavere tal vises først i dropdown-menuer
                  </p>
                </div>
              </div>
              
              {submitError && (
                <Alert variant="destructive" className="border-brand-error bg-brand-error/10">
                  <AlertTriangle className="h-4 w-4 text-brand-error" />
                  <AlertDescription className="text-brand-error">
                    <strong>Fejl:</strong> {submitError}
                    <div className="mt-2 space-y-1">
                      <p className="font-medium">Sådan løser du problemet:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Sørg for at både værdi og label er udfyldt</li>
                        <li>Brug en unik værdi der ikke allerede eksisterer</li>
                        <li>Kontroller din internetforbindelse</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="border-brand-gray-300 text-brand-gray-700 hover:bg-brand-gray-50"
                >
                  Annuller
                </Button>
                <Button 
                  onClick={handleCreateUnit} 
                  disabled={isSubmitting || !unitForm.value.trim() || !unitForm.label.trim()}
                  className="btn-brand-primary"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opretter enhed...
                    </div>
                  ) : (
                    'Opret enhed'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Unit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="bg-white border-brand-gray-200">
              <DialogHeader>
                <DialogTitle className="text-brand-gray-900">Rediger enhed</DialogTitle>
                <DialogDescription className="text-brand-gray-600">
                  Opdater enhedens oplysninger og indstillinger.
                </DialogDescription>
              </DialogHeader>
              
              {submitStatus !== 'idle' && (
                <Alert className={cn(
                  "border-l-4",
                  submitStatus === 'success' ? "border-brand-success bg-brand-success/10" : 
                  submitStatus === 'error' ? "border-brand-error bg-brand-error/10" :
                  "border-brand-primary bg-brand-primary/10"
                )}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <AlertDescription className={cn(
                      submitStatus === 'success' ? "text-brand-success" :
                      submitStatus === 'error' ? "text-brand-error" :
                      "text-brand-primary"
                    )}>
                      {getStatusMessage()}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-value" className="text-brand-gray-700">Værdi *</Label>
                  <Input
                    id="edit-value"
                    value={unitForm.value}
                    onChange={(e) => {
                      setUnitForm({...unitForm, value: e.target.value});
                      setSubmitError(null);
                    }}
                    placeholder="f.eks. kg, stk, liter"
                    className="input-brand"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-label" className="text-brand-gray-700">Label *</Label>
                  <Input
                    id="edit-label"
                    value={unitForm.label}
                    onChange={(e) => {
                      setUnitForm({...unitForm, label: e.target.value});
                      setSubmitError(null);
                    }}
                    placeholder="f.eks. Kilogram (kg), Stykker"
                    className="input-brand"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-description" className="text-brand-gray-700">Beskrivelse</Label>
                  <Textarea
                    id="edit-description"
                    value={unitForm.description}
                    onChange={(e) => setUnitForm({...unitForm, description: e.target.value})}
                    placeholder="Valgfri beskrivelse af enheden"
                    className="input-brand"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={unitForm.isActive}
                    onCheckedChange={(checked) => setUnitForm({...unitForm, isActive: checked})}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-active" className="text-brand-gray-700">
                    Enhed er aktiv
                  </Label>
                </div>
                
                <div>
                  <Label htmlFor="edit-sortOrder" className="text-brand-gray-700">Sorteringsrækkefølge</Label>
                  <Input
                    id="edit-sortOrder"
                    type="number"
                    value={unitForm.sortOrder}
                    onChange={(e) => setUnitForm({...unitForm, sortOrder: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="input-brand"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              {submitError && (
                <Alert variant="destructive" className="border-brand-error bg-brand-error/10">
                  <AlertTriangle className="h-4 w-4 text-brand-error" />
                  <AlertDescription className="text-brand-error">
                    {submitError}
                  </AlertDescription>
                </Alert>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedUnit(null);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="border-brand-gray-300 text-brand-gray-700 hover:bg-brand-gray-50"
                >
                  Annuller
                </Button>
                <Button 
                  onClick={handleUpdateUnit} 
                  disabled={isSubmitting || !unitForm.value.trim() || !unitForm.label.trim()}
                  className="btn-brand-primary"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opdaterer...
                    </div>
                  ) : (
                    'Gem ændringer'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Unit Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="bg-white border-brand-gray-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-brand-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-brand-error" />
                  Bekræft sletning
                </AlertDialogTitle>
                <AlertDialogDescription className="text-brand-gray-600">
                  <div className="space-y-3">
                    <p>
                      Er du sikker på, at du vil slette enheden <strong>"{selectedUnit?.label}"</strong>?
                    </p>
                    
                    {selectedUnit && selectedUnit.productCount > 0 && (
                      <div className="p-3 bg-brand-error/10 border border-brand-error/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-brand-error mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-brand-error">
                              ⚠️ ADVARSEL: Dette vil også slette {selectedUnit.productCount} produkt(er)
                            </p>
                            <p className="text-brand-error/80 mt-1">
                              Alle produkter der bruger denne enhed vil blive permanent slettet, 
                              og kategoristatistikker vil blive opdateret automatisk.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm">
                      <strong>Denne handling kan ikke fortrydes.</strong>
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              {submitStatus !== 'idle' && (
                <Alert className={cn(
                  "border-l-4",
                  submitStatus === 'success' ? "border-brand-success bg-brand-success/10" : 
                  submitStatus === 'error' ? "border-brand-error bg-brand-error/10" :
                  "border-brand-primary bg-brand-primary/10"
                )}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <AlertDescription className={cn(
                      submitStatus === 'success' ? "text-brand-success" :
                      submitStatus === 'error' ? "text-brand-error" :
                      "text-brand-primary"
                    )}>
                      {getStatusMessage()}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
              
              <AlertDialogFooter>
                <AlertDialogCancel 
                  disabled={isSubmitting}
                  className="border-brand-gray-300 text-brand-gray-700 hover:bg-brand-gray-50"
                >
                  Annuller
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteUnit}
                  disabled={isSubmitting}
                  className="bg-brand-error hover:bg-brand-error/90 text-white"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sletter...
                    </div>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Slet enhed {selectedUnit?.productCount && selectedUnit.productCount > 0 ? `og ${selectedUnit.productCount} produkter` : ''}
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Products Dialog */}
          <Dialog open={isProductsDialogOpen} onOpenChange={setIsProductsDialogOpen}>
            <DialogContent className="max-w-4xl bg-white border-brand-gray-200">
              <DialogHeader>
                <DialogTitle className="text-brand-gray-900">
                  Produkter med enheden "{selectedUnit?.label}"
                </DialogTitle>
                <DialogDescription className="text-brand-gray-600">
                  Oversigt over produkter der bruger denne enhed.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-96 overflow-y-auto">
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-brand-primary">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Indlæser produkter...</span>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-brand-gray-700">Produktnavn</TableHead>
                        <TableHead className="text-brand-gray-700">Varenummer</TableHead>
                        <TableHead className="text-brand-gray-700">Pris</TableHead>
                        <TableHead className="text-brand-gray-700">Kategori</TableHead>
                        <TableHead className="text-brand-gray-700">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unitProducts.map((product) => (
                        <TableRow key={product._id}>
                          <TableCell className="font-medium text-brand-gray-900">{product.produktnavn}</TableCell>
                          <TableCell className="font-mono text-sm text-brand-gray-600">{product.varenummer}</TableCell>
                          <TableCell className="text-brand-gray-700">{formatPrice(product.basispris)}</TableCell>
                          <TableCell className="text-brand-gray-600">{product.kategori.navn}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={product.aktiv ? 'default' : 'secondary'}
                              className={product.aktiv ? 'bg-brand-success text-white' : 'bg-brand-gray-200 text-brand-gray-600'}
                            >
                              {product.aktiv ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {unitProducts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-brand-gray-500">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="h-8 w-8 text-brand-gray-300" />
                              <span>Ingen produkter fundet med denne enhed</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => setIsProductsDialogOpen(false)}
                  className="btn-brand-primary"
                >
                  Luk
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardUnits; 