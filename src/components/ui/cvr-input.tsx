import React, { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Building2, 
  Users, 
  Calendar,
  MapPin,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { validateCVR, formatCVRNumber, isValidCVRFormat, CVRData, CVRValidationResult } from '../../lib/cvr';

interface CVRInputProps {
  value: string;
  onChange: (value: string) => void;
  onCompanyDataChange: (data: CVRData | null) => void;
  onValidationChange: (isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export const CVRInput: React.FC<CVRInputProps> = ({
  value,
  onChange,
  onCompanyDataChange,
  onValidationChange,
  label = "CVR nummer",
  placeholder = "12345678",
  required = false,
  disabled = false,
  error: externalError
}) => {
  const [validationState, setValidationState] = useState<CVRValidationResult>({ valid: false });
  const [companyData, setCompanyData] = useState<CVRData | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastValidatedCVR = useRef<string>('');

  // Auto-validate CVR when value changes
  useEffect(() => {
    const cleanCVR = value.replace(/\s/g, '');
    
    // Clear previous validation timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset state if CVR is cleared or invalid format
    if (!cleanCVR || cleanCVR.length < 8) {
      setValidationState({ valid: false });
      setCompanyData(null);
      setShowCompanyInfo(false);
      onValidationChange(false);
      onCompanyDataChange(null);
      return;
    }

    // Only validate if format is correct and different from last validated
    if (isValidCVRFormat(cleanCVR) && cleanCVR !== lastValidatedCVR.current) {
      setIsValidating(true);
      
      // Debounce validation to avoid too many API calls
      debounceRef.current = setTimeout(async () => {
        console.log('🔍 Starting CVR validation for:', cleanCVR);
        
        try {
          const result = await validateCVR(cleanCVR);
          
          setValidationState(result);
          setIsValidating(false);
          lastValidatedCVR.current = cleanCVR;
          
          if (result.valid && result.data) {
            setCompanyData(result.data);
            setShowCompanyInfo(true);
            onCompanyDataChange(result.data);
            onValidationChange(true);
            console.log('✅ CVR validation successful, company data:', result.data);
          } else {
            setCompanyData(null);
            setShowCompanyInfo(false);
            onCompanyDataChange(null);
            onValidationChange(false);
            console.log('❌ CVR validation failed:', result.error);
          }
        } catch (error) {
          console.error('❌ CVR validation error:', error);
          setValidationState({ 
            valid: false, 
            error: 'Fejl ved validering af CVR nummer' 
          });
          setIsValidating(false);
          setCompanyData(null);
          setShowCompanyInfo(false);
          onCompanyDataChange(null);
          onValidationChange(false);
        }
      }, 800); // 800ms debounce
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, onCompanyDataChange, onValidationChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow only digits and spaces, max 11 characters (formatted: XX XX XX XX)
    const cleanValue = inputValue.replace(/[^\d\s]/g, '').substring(0, 11);
    onChange(cleanValue);
  };

  const handleManualRefresh = async () => {
    const cleanCVR = value.replace(/\s/g, '');
    if (!isValidCVRFormat(cleanCVR)) return;
    
    setIsValidating(true);
    lastValidatedCVR.current = ''; // Force re-validation
    
    const result = await validateCVR(cleanCVR);
    setValidationState(result);
    setIsValidating(false);
    
    if (result.valid && result.data) {
      setCompanyData(result.data);
      setShowCompanyInfo(true);
      onCompanyDataChange(result.data);
      onValidationChange(true);
    } else {
      setCompanyData(null);
      setShowCompanyInfo(false);
      onCompanyDataChange(null);
      onValidationChange(false);
    }
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (validationState.valid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (validationState.error || externalError) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    const cleanCVR = value.replace(/\s/g, '');
    if (cleanCVR && !isValidCVRFormat(cleanCVR)) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    
    return null;
  };

  const getValidationMessage = () => {
    if (externalError) return externalError;
    if (validationState.error) return validationState.error;
    
    const cleanCVR = value.replace(/\s/g, '');
    if (cleanCVR && !isValidCVRFormat(cleanCVR)) {
      return 'CVR nummer skal være 8 cifre';
    }
    
    if (isValidating) return 'Validerer CVR nummer...';
    if (validationState.valid) return 'CVR nummer er gyldigt';
    
    return null;
  };

  const getInputBorderColor = () => {
    if (externalError || validationState.error) return 'border-red-500';
    if (validationState.valid) return 'border-green-500';
    if (isValidating) return 'border-blue-500';
    
    const cleanCVR = value.replace(/\s/g, '');
    if (cleanCVR && !isValidCVRFormat(cleanCVR)) return 'border-yellow-500';
    
    return '';
  };

  const canSubmit = validationState.valid && !isValidating;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="cvr-input" className="text-sm font-medium">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          
          {/* Validation status badge */}
          {!canSubmit && value && (
            <Badge 
              variant={validationState.valid ? "default" : "destructive"}
              className="text-xs"
            >
              {isValidating ? "Validerer..." : "Skal valideres"}
            </Badge>
          )}
          
          {canSubmit && (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
              ✓ Valideret
            </Badge>
          )}
        </div>
        
        <div className="relative">
          <Input
            id="cvr-input"
            type="text"
            placeholder={placeholder}
            value={formatCVRNumber(value)}
            onChange={handleInputChange}
            disabled={disabled}
            className={`pr-12 ${getInputBorderColor()}`}
            maxLength={11}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {getValidationIcon()}
            
            {validationState.valid && !isValidating && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleManualRefresh}
                className="h-6 w-6 p-0"
                title="Genindlæs virksomhedsdata"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Validation message */}
        {getValidationMessage() && (
          <p className={`text-xs ${
            validationState.valid ? 'text-green-600' : 
            validationState.error || externalError ? 'text-red-600' : 
            isValidating ? 'text-blue-600' : 'text-yellow-600'
          }`}>
            {getValidationMessage()}
          </p>
        )}
      </div>

      {/* Company information display */}
      {showCompanyInfo && companyData && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Virksomhedsoplysninger</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium text-green-900">{companyData.companyName}</p>
                  {companyData.companyType && (
                    <p className="text-green-700">{companyData.companyType}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  {companyData.industry && (
                    <div className="flex items-center gap-1 text-green-700">
                      <span className="text-xs">Branche:</span>
                      <span className="text-xs">{companyData.industry}</span>
                    </div>
                  )}
                  
                  {companyData.employees !== undefined && companyData.employees > 0 && (
                    <div className="flex items-center gap-1 text-green-700">
                      <Users className="h-3 w-3" />
                      <span className="text-xs">{companyData.employees} medarbejdere</span>
                    </div>
                  )}
                  
                  {companyData.foundedYear && (
                    <div className="flex items-center gap-1 text-green-700">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs">Stiftet {companyData.foundedYear}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {companyData.address && (
                <div className="flex items-start gap-2 pt-2 border-t border-green-200">
                  <MapPin className="h-3 w-3 text-green-600 mt-0.5" />
                  <div className="text-xs text-green-700">
                    <p>{companyData.address.street}</p>
                    <p>{companyData.address.postalCode} {companyData.address.city}</p>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-green-600 pt-2 border-t border-green-200">
                ✓ Virksomhedsdata hentet fra CVR-registret
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission warning */}
      {value && !canSubmit && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            CVR nummer skal være valideret før ansøgningen kan sendes
          </p>
        </div>
      )}
    </div>
  );
}; 