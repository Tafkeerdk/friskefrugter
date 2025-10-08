import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, Trash2, AlertTriangle, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { tokenManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface TilbudsGruppe {
  id: string;
  name: string;
  description?: string;
  discountPercentage: number;
  color: string;
  customerCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: string;
  companyName: string;
  contactPersonName: string;
  email: string;
  phone: string;
  cvrNumber: string;
  discountGroup: {
    id?: string;
    name: string;
    discountPercentage: number;
    color?: string;
  };
}

const DashboardTilbudsgrupper: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [tilbudsgrupper, setTilbudsgrupper] = useState<TilbudsGruppe[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTilbudsgruppe, setSelectedTilbudsgruppe] = useState<TilbudsGruppe | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountPercentage: 0,
    color: '#609c14'
  });
  
  // Loading states
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load tilbudsgrupper and customers in parallel
      const [tilbudsgrupperResponse, customersResponse] = await Promise.all([
        loadTilbudsgrupper(),
        loadCustomers()
      ]);
      
      if (!tilbudsgrupperResponse.success) {
        throw new Error(tilbudsgrupperResponse.message || 'Kunne ikke indlæse tilbudsgrupper');
      }
      
      if (!customersResponse.success) {
        throw new Error(customersResponse.message || 'Kunne ikke indlæse kunder');
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadTilbudsgrupper = async () => {
    try {
      const token = tokenManager.getAccessToken('admin');
      if (!token) {
        return { success: false, message: 'Ikke godkendt. Log venligst ind igen.' };
      }

      const apiResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://famous-dragon-b033ac.netlify.app'}/.netlify/functions/admin-discount-groups`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Session-Type': 'browser',
            'X-PWA': 'false',
            'X-Display-Mode': 'browser'
          }
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const response = await apiResponse.json();

      if (response.success) {
        // Map discountGroups to tilbudsgrupper format
        const groups = response.discountGroups || [];
        setTilbudsgrupper(groups.map((group: any) => ({
          id: group._id || group.id,
          name: group.name,
          description: group.description,
          discountPercentage: group.discountPercentage,
          color: group.color,
          customerCount: group.customerCount || 0,
          isActive: group.isActive !== false,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt
        })));
      }
      
      return response;
    } catch (error) {
      console.error('Error loading tilbudsgrupper:', error);
      return { success: false, message: 'Netværksfejl ved indlæsning af tilbudsgrupper' };
    }
  };

  const loadCustomers = async () => {
    try {
      const token = tokenManager.getAccessToken('admin');
      if (!token) {
        return { success: false, message: 'Ikke godkendt. Log venligst ind igen.' };
      }

      const apiResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://famous-dragon-b033ac.netlify.app'}/.netlify/functions/admin-customers`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Session-Type': 'browser',
            'X-PWA': 'false',
            'X-Display-Mode': 'browser'
          }
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const response = await apiResponse.json();

      if (response.success) {
        setCustomers(response.customers || []);
      }
      
      return response;
    } catch (error) {
      console.error('Error loading customers:', error);
      return { success: false, message: 'Netværksfejl ved indlæsning af kunder' };
    }
  };

  const handleCreateTilbudsgruppe = async () => {
    try {
      setCreateLoading(true);
      setError(null);

      const token = tokenManager.getAccessToken('admin');
      if (!token) {
        throw new Error('Ikke godkendt. Log venligst ind igen.');
      }

      const apiResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://famous-dragon-b033ac.netlify.app'}/.netlify/functions/admin-discount-groups`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Session-Type': 'browser',
            'X-PWA': 'false',
            'X-Display-Mode': 'browser'
          },
          body: JSON.stringify(formData)
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const response = await apiResponse.json();

      if (response.success) {
        toast({
          title: "Tilbudsgruppe oprettet",
          description: `${formData.name} er blevet oprettet succesfuldt.`,
        });
        
        // Reset form and close dialog
        setFormData({ name: '', description: '', discountPercentage: 0, color: '#609c14' });
        setCreateDialogOpen(false);
        
        // Reload data
        await loadData();
      } else {
        throw new Error(response.message || 'Kunne ikke oprette tilbudsgruppe');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: errorMessage,
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditTilbudsgruppe = async () => {
    if (!selectedTilbudsgruppe) return;
    
    try {
      setEditLoading(true);
      setError(null);

      const token = tokenManager.getAccessToken('admin');
      if (!token) {
        throw new Error('Ikke godkendt. Log venligst ind igen.');
      }

      const apiResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://famous-dragon-b033ac.netlify.app'}/.netlify/functions/admin-discount-groups`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Session-Type': 'browser',
            'X-PWA': 'false',
            'X-Display-Mode': 'browser'
          },
          body: JSON.stringify({
            discountGroupId: selectedTilbudsgruppe.id,
            ...formData
          })
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const response = await apiResponse.json();

      if (response.success) {
        toast({
          title: "Tilbudsgruppe opdateret",
          description: `${formData.name} er blevet opdateret succesfuldt.`,
        });
        
        // Reset form and close dialog
        setFormData({ name: '', description: '', discountPercentage: 0, color: '#609c14' });
        setEditDialogOpen(false);
        setSelectedTilbudsgruppe(null);
        
        // Reload data
        await loadData();
      } else {
        throw new Error(response.message || 'Kunne ikke opdatere tilbudsgruppe');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: errorMessage,
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTilbudsgruppe = async (tilbudsgruppe: TilbudsGruppe) => {
    try {
      setDeleteLoading(true);
      setError(null);

      const token = tokenManager.getAccessToken('admin');
      if (!token) {
        throw new Error('Ikke godkendt. Log venligst ind igen.');
      }

      const apiResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://famous-dragon-b033ac.netlify.app'}/.netlify/functions/admin-discount-groups`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Session-Type': 'browser',
            'X-PWA': 'false',
            'X-Display-Mode': 'browser'
          },
          body: JSON.stringify({ discountGroupId: tilbudsgruppe.id })
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const response = await apiResponse.json();

      if (response.success) {
        toast({
          title: "Tilbudsgruppe slettet",
          description: `${tilbudsgruppe.name} er blevet slettet. Alle kunder er flyttet til Standard gruppen.`,
        });
        
        // Reload data
        await loadData();
      } else {
        throw new Error(response.message || 'Kunne ikke slette tilbudsgruppe');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: errorMessage,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditDialog = (tilbudsgruppe: TilbudsGruppe) => {
    setSelectedTilbudsgruppe(tilbudsgruppe);
    setFormData({
      name: tilbudsgruppe.name,
      description: tilbudsgruppe.description || '',
      discountPercentage: tilbudsgruppe.discountPercentage,
      color: tilbudsgruppe.color
    });
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-2 text-brand-gray-600">Indlæser tilbudsgrupper...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/admin/customers')}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-gray-900">
                Administrer Tilbudsgrupper
              </h2>
              <p className="text-sm md:text-base text-brand-gray-600 mt-1">
                Opret, rediger og administrer tilbudsgrupper for dine kunder.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 lg:flex-shrink-0">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto btn-brand-primary">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Opret Tilbudsgruppe</span>
                  <span className="sm:hidden">Opret</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Opret Ny Tilbudsgruppe</DialogTitle>
                  <DialogDescription>
                    Opret en ny tilbudsgruppe med rabat og farve.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Navn *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="f.eks. Guldkunder"
                      className="input-brand"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Beskrivelse</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Valgfri beskrivelse af tilbudsgruppen"
                      className="input-brand"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="discount">Rabat Procent *</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="input-brand"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="color">Farve</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#609c14"
                        className="input-brand flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={createLoading}
                  >
                    Annuller
                  </Button>
                  <Button 
                    onClick={handleCreateTilbudsgruppe}
                    disabled={!formData.name || createLoading}
                    className="btn-brand-primary"
                  >
                    {createLoading ? 'Opretter...' : 'Opret Tilbudsgruppe'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tilbudsgrupper Grid */}
        <div className="content-width">
          {tilbudsgrupper.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-lg font-medium text-brand-gray-600">Ingen tilbudsgrupper fundet</p>
                  <p className="text-sm text-brand-gray-500 mt-1">
                    Opret din første tilbudsgruppe for at komme i gang
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tilbudsgrupper.map((gruppe) => (
                <Card key={gruppe.id} className="card-brand overflow-hidden h-full">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-brand-gray-900 truncate">
                          {gruppe.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-brand-gray-600 mt-1">
                          {gruppe.description || 'Ingen beskrivelse'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(gruppe)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-brand-error hover:text-brand-error"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Slet Tilbudsgruppe</AlertDialogTitle>
                              <AlertDialogDescription>
                                Er du sikker på, at du vil slette "{gruppe.name}"? 
                                Alle kunder i denne gruppe vil blive flyttet til Standard gruppen.
                                Denne handling kan ikke fortrydes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuller</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTilbudsgruppe(gruppe)}
                                className="bg-brand-error hover:bg-brand-error/90"
                              >
                                Slet Tilbudsgruppe
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-2">
                    <div className="space-y-3">
                      {/* Discount Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-brand-gray-600">Rabat:</span>
                        <Badge 
                          className="font-semibold"
                          style={{
                            backgroundColor: `${gruppe.color}20`,
                            borderColor: gruppe.color,
                            color: gruppe.color
                          }}
                        >
                          {gruppe.discountPercentage}%
                        </Badge>
                      </div>
                      
                      {/* Customer Count */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-brand-gray-600">Kunder:</span>
                        <span className="text-sm font-medium text-brand-gray-900">
                          {gruppe.customerCount}
                        </span>
                      </div>
                      
                      {/* Color Preview */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-brand-gray-600">Farve:</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: gruppe.color }}
                          />
                          <span className="text-xs text-brand-gray-500 font-mono">
                            {gruppe.color}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Rediger Tilbudsgruppe</DialogTitle>
              <DialogDescription>
                Opdater tilbudsgruppens information.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Navn *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="f.eks. Guldkunder"
                  className="input-brand"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Beskrivelse</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Valgfri beskrivelse af tilbudsgruppen"
                  className="input-brand"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-discount">Rabat Procent *</Label>
                <Input
                  id="edit-discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="input-brand"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-color">Farve</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#609c14"
                    className="input-brand flex-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                disabled={editLoading}
              >
                Annuller
              </Button>
              <Button 
                onClick={handleEditTilbudsgruppe}
                disabled={!formData.name || editLoading}
                className="btn-brand-primary"
              >
                {editLoading ? 'Opdaterer...' : 'Gem Ændringer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardTilbudsgrupper;
