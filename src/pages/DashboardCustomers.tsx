import React, { useState, useEffect } from "react";
import { MoreHorizontal, Mail, Phone, Calendar, Plus, Trash2, AlertTriangle, Send, Percent } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  companyName: string;
  cvrNumber: string;
  contactPersonName: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  discountGroup: {
    id?: string;
    name: string;
    discountPercentage: number;
    color?: string;
  };
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

interface DiscountGroup {
  id: string;
  name: string;
  description?: string;
  discountPercentage: number;
  color: string;
  customerCount: number;
  formattedDiscount: string;
}

const DashboardCustomers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [discountGroups, setDiscountGroups] = useState<DiscountGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discountGroupDialogOpen, setDiscountGroupDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [discountGroupLoading, setDiscountGroupLoading] = useState(false);
  const [sendRemovalEmail, setSendRemovalEmail] = useState(false);
  const [removalReason, setRemovalReason] = useState('');
  const [selectedDiscountGroupId, setSelectedDiscountGroupId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadCustomers(), loadDiscountGroups()]);
  };

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.getCustomers({ search: searchTerm });
      
      if (response.success) {
        setCustomers(response.customers);
      } else {
        setError('Kunne ikke hente kunder');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDiscountGroups = async () => {
    try {
      const response = await authService.getDiscountGroups();
      if (response.success) {
        setDiscountGroups(response.discountGroups as DiscountGroup[]);
      }
    } catch (err) {
      console.error('Error loading discount groups:', err);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCustomers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      setDeleteLoading(true);
      const response = await authService.deleteCustomer(selectedCustomer.id, {
        sendEmail: sendRemovalEmail,
        reason: removalReason.trim()
      });

      if (response.success) {
        toast({
          title: "Kunde slettet",
          description: response.emailSent 
            ? "Kunden er slettet og email er sendt" 
            : "Kunden er slettet",
        });

        // Remove customer from local state
        setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
        
        // Close dialog
        setDeleteDialogOpen(false);
        setSelectedCustomer(null);
        setSendRemovalEmail(false);
        setRemovalReason('');
      } else {
        setError(response.message || 'Kunne ikke slette kunde');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateDiscountGroup = async () => {
    if (!selectedCustomer || !selectedDiscountGroupId) return;

    try {
      setDiscountGroupLoading(true);
      const response = await authService.updateCustomerDiscountGroup(
        selectedCustomer.id, 
        selectedDiscountGroupId
      );

      if (response.success) {
        toast({
          title: "Rabatgruppe opdateret",
          description: response.message,
        });

        // Update customer in local state
        setCustomers(prev => prev.map(customer => 
          customer.id === selectedCustomer.id 
            ? { ...customer, discountGroup: response.customer.discountGroup }
            : customer
        ));

        // Close dialog
        setDiscountGroupDialogOpen(false);
        setSelectedCustomer(null);
        setSelectedDiscountGroupId('');

        // Reload discount groups to update customer counts
        await loadDiscountGroups();
      } else {
        setError(response.message || 'Kunne ikke opdatere rabatgruppe');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
    } finally {
      setDiscountGroupLoading(false);
    }
  };

  const openDiscountGroupDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedDiscountGroupId(customer.discountGroup.id || '');
    setDiscountGroupDialogOpen(true);
  };

  const getDiscountGroupColor = (group: { name: string; discountPercentage: number }) => {
    const percentage = group.discountPercentage;
    if (percentage >= 20) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (percentage >= 15) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (percentage >= 10) return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Henter kunder...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kunder</h2>
          <p className="text-muted-foreground">
            Administrer dine kunder og deres information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Søg efter kunde..." 
            className="w-64" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button 
            className="flex items-center gap-1"
            onClick={() => navigate('/admin/customers/new')}
          >
            <Plus className="h-4 w-4" />
            <span>Tilføj kunde</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">Ingen kunder fundet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm ? 'Prøv at ændre dine søgekriterier' : 'Der er ingen aktive kunder endnu'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <Card key={customer.id} className="overflow-hidden h-full">
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(customer.companyName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{customer.companyName}</h3>
                      <Badge
                        className={`mt-1 rounded-full px-2.5 ${getDiscountGroupColor(customer.discountGroup)}`}
                      >
                        {customer.discountGroup.name} ({customer.discountGroup.discountPercentage}%)
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Handlinger</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Se detaljer</DropdownMenuItem>
                      <DropdownMenuItem>Rediger</DropdownMenuItem>
                      <DropdownMenuItem>Se ordrer</DropdownMenuItem>
                      <DropdownMenuItem>Send faktura</DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDiscountGroupDialog(customer)}
                      >
                        <Percent className="h-4 w-4 mr-2" />
                        Ændre rabatgruppe
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Slet kunde
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>CVR: {customer.cvrNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {customer.lastLogin 
                          ? `Sidst aktiv: ${formatDate(customer.lastLogin)}`
                          : `Oprettet: ${formatDate(customer.createdAt)}`
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Customer Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet kunde</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette <strong>{selectedCustomer?.companyName}</strong>?
              Denne handling kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="send-email" 
                checked={sendRemovalEmail}
                onCheckedChange={(checked) => setSendRemovalEmail(checked as boolean)}
              />
              <Label htmlFor="send-email" className="text-sm">
                Send email til kunden om fjernelse af adgang
              </Label>
            </div>
            
            {sendRemovalEmail && (
              <div className="space-y-2">
                <Label htmlFor="removal-reason">Begrundelse (vises i email)</Label>
                <Textarea
                  id="removal-reason"
                  placeholder="Angiv årsag til fjernelse af kundens adgang..."
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sletter...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Slet kunde
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discount Group Assignment Dialog */}
      <Dialog open={discountGroupDialogOpen} onOpenChange={setDiscountGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ændre rabatgruppe</DialogTitle>
            <DialogDescription>
              Vælg en ny rabatgruppe for <strong>{selectedCustomer?.companyName}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="discount-group">Nuværende rabatgruppe</Label>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedCustomer?.discountGroup.name}</span>
                  <Badge variant="outline">
                    {selectedCustomer?.discountGroup.discountPercentage}% rabat
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-discount-group">Ny rabatgruppe</Label>
              <Select 
                value={selectedDiscountGroupId} 
                onValueChange={setSelectedDiscountGroupId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg rabatgruppe" />
                </SelectTrigger>
                <SelectContent>
                  {discountGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{group.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {group.discountPercentage}%
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDiscountGroupId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    {(() => {
                      const selectedGroup = discountGroups.find(g => g.id === selectedDiscountGroupId);
                      return selectedGroup ? 
                        `Kunden vil få ${selectedGroup.discountPercentage}% rabat med ${selectedGroup.name} gruppen` :
                        '';
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setDiscountGroupDialogOpen(false);
                setSelectedCustomer(null);
                setSelectedDiscountGroupId('');
              }}
              disabled={discountGroupLoading}
            >
              Annuller
            </Button>
            <Button
              onClick={handleUpdateDiscountGroup}
              disabled={discountGroupLoading || !selectedDiscountGroupId || selectedDiscountGroupId === selectedCustomer?.discountGroup.id}
            >
              {discountGroupLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Opdaterer...
                </>
              ) : (
                <>
                  <Percent className="h-4 w-4 mr-2" />
                  Opdater rabatgruppe
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardCustomers;
