import React from 'react';
import { useParams } from 'react-router-dom';
import { ProductSetupInterface } from '@/components/products/setup/ProductSetupInterface';

const ProductSetup: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <ProductSetupInterface 
      productId={id}
      onSuccess={(data) => {
        console.log('Product saved successfully:', data);
      }}
    />
  );
};

export default ProductSetup; 