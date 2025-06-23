import React, { useState, useEffect } from "react";
import { MoreHorizontal, Mail, Phone, Calendar, Plus, Trash2, AlertTriangle, Send } from "lucide-react";
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
    name: string;
    discountPercentage: number;
    color?: string;
  };
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

const DashboardCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sendRemovalEmail, setSendRemovalEmail] = useState(false);
  const [removalReason, setRemovalReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

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
          <Button className="flex items-center gap-1">
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
    </DashboardLayout>
  );
};

export default DashboardCustomers;
