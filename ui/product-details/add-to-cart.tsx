'use client';

import { useState } from 'react';
import Button from '@/ui/button';
import QuantitySelector from '@/ui/quantity-selector';

const AddToCart = () => {
  const [qtyToAdd, setQtyToAdd] = useState(1);

  const handleAddToCart = () => {
    //
  };

  return (
    <div className="flex gap-4">
      <QuantitySelector value={qtyToAdd} handleChange={setQtyToAdd} />
      <Button onClick={handleAddToCart}>Add To Cart</Button>
    </div>
  );
};

export default AddToCart;
