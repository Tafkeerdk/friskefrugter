/**
 * CVR (Central Business Register) API Integration
 * Direct frontend integration with Danish CVR API for company validation and auto-fill
 */

export interface CVRData {
  companyName: string;
  companyType?: string;
  industry?: string;
  employees?: number;
  foundedYear?: number;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface CVRValidationResult {
  valid: boolean;
  data?: CVRData;
  error?: string;
  loading?: boolean;
}

/**
 * Validate CVR number format (8 digits)
 */
export const isValidCVRFormat = (cvrNumber: string): boolean => {
  const cleanCVR = cvrNumber.replace(/\s/g, '');
  return /^\d{8}$/.test(cleanCVR);
};

/**
 * Format CVR number for display (XX XX XX XX)
 */
export const formatCVRNumber = (cvrNumber: string): string => {
  const cleanCVR = cvrNumber.replace(/\s/g, '');
  if (cleanCVR.length === 8) {
    return cleanCVR.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }
  return cvrNumber;
};

/**
 * Validate CVR number and fetch company data from Danish CVR API
 */
export const validateCVR = async (cvrNumber: string): Promise<CVRValidationResult> => {
  try {
    // Clean and validate format first
    const cleanCVR = cvrNumber.replace(/\s/g, '');
    
    if (!isValidCVRFormat(cleanCVR)) {
      return {
        valid: false,
        error: 'CVR nummer skal være 8 cifre'
      };
    }

    console.log('🔍 Validating CVR:', cleanCVR);

    // Call CVR API directly from frontend
    const response = await fetch(`https://cvrapi.dk/api?search=${cleanCVR}&country=dk`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`CVR API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 CVR API response:', data);

    // Check if CVR number was found and is valid
    if (data.status === 200 && data.vat === parseInt(cleanCVR)) {
      const cvrData: CVRData = {
        companyName: data.name || '',
        companyType: data.companytype || '',
        industry: data.industrycode?.text || '',
        employees: data.employees || 0,
        foundedYear: data.startdate ? new Date(data.startdate).getFullYear() : undefined,
        address: data.address && data.city && data.zipcode ? {
          street: data.address,
          city: data.city,
          postalCode: data.zipcode,
          country: 'Denmark'
        } : undefined
      };

      console.log('✅ CVR validation successful:', cvrData);

      return {
        valid: true,
        data: cvrData
      };
    } else {
      console.log('❌ CVR not found or invalid');
      return {
        valid: false,
        error: 'CVR nummer ikke fundet i registret'
      };
    }

  } catch (error) {
    console.error('❌ CVR validation error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Kunne ikke validere CVR nummer';
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Netværksfejl - tjek din internetforbindelse';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'CVR validering tog for lang tid - prøv igen';
      }
    }

    return {
      valid: false,
      error: errorMessage
    };
  }
};

/**
 * Check if company already exists in our system
 */
export const checkCompanyExists = async (cvrNumber: string, email: string): Promise<{ exists: boolean; error?: string }> => {
  try {
    const cleanCVR = cvrNumber.replace(/\s/g, '');
    
    // This would typically call your backend API to check for existing applications
    // For now, we'll implement this as a placeholder
    console.log('🔍 Checking if company exists:', { cvrNumber: cleanCVR, email });
    
    // TODO: Implement actual backend check
    // const response = await fetch('/api/auth/customer/check-exists', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ cvrNumber: cleanCVR, email })
    // });
    
    return { exists: false };
    
  } catch (error) {
    console.error('❌ Error checking company existence:', error);
    return { 
      exists: false, 
      error: 'Kunne ikke tjekke om virksomheden allerede eksisterer' 
    };
  }
};

/**
 * Debounced CVR validation hook for React components
 */
export const useDebouncedCVRValidation = (delay: number = 500) => {
  let timeoutId: NodeJS.Timeout;
  
  return (cvrNumber: string, callback: (result: CVRValidationResult) => void) => {
    clearTimeout(timeoutId);
    
    if (!cvrNumber || cvrNumber.length < 8) {
      callback({ valid: false, loading: false });
      return;
    }
    
    callback({ valid: false, loading: true });
    
    timeoutId = setTimeout(async () => {
      const result = await validateCVR(cvrNumber);
      callback({ ...result, loading: false });
    }, delay);
  };
}; 