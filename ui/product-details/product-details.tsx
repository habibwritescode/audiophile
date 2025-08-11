'use client';

import data from '@/lib/data.json';
import GoBack from '@/ui/go-back';
import Image from 'next/image';
import { formatAmount } from '@/lib/helpers';
import Button from '@/ui/button';
import ProductGallery from './gallery';
import SimilarProducts from './similar-products';
import ShopCategories from '@/ui/shop-categories/shop-categories';
import QuantitySelector from '@/ui/quantity-selector';
import { useState } from 'react';

const ProductDetails = ({ slug }: { slug: string }) => {
  const product = data.find((item) => item.slug === slug);

  const [qtyToAdd, setQtyToAdd] = useState(1);

  const handleQuantityChange = (quantity: number) => {
    setQtyToAdd(quantity);
  };

  const handleAddToCart = () => {
    //
  };

  if (!product) {
    return <div className="pt-20 text-center text-24 text-primary">Product not found</div>;
  }

  return (
    <div className="px-6 pt-4 md:px-10 md:pt-8 xl:pt-20">
      <div className="mx-auto max-w-6xl">
        <GoBack />

        <section className="mt-6 grid gap-8 md:grid-cols-2 md:gap-17.25 xl:mt-14 xl:gap-31">
          <div className={``}>
            <Image
              alt=""
              src={product.image.mobile}
              width={327}
              height={327}
              className="h-auto w-full rounded-lg md:hidden"
            />
            <Image
              alt=""
              src={product.image.tablet}
              width={281}
              height={480}
              className="hidden h-auto w-full rounded-lg md:block xl:hidden"
            />
            <Image
              alt=""
              src={product.image.mobile}
              width={540}
              height={560}
              className="hidden xl:block"
            />
          </div>

          <div className="flex flex-col justify-center">
            {product.new ? <p className="text-14 text-primary uppercase"> New Product</p> : null}
            <h2
              className={`${product.new ? 'mt-6 md:mt-4' : 'mt-10 md:mt-0'} mb-6 max-w-75 text-28 text-black uppercase md:mb-8 md:text-40 xl:text-start`}
            >
              {product.name}
            </h2>
            <p className="mb-6 max-w-143 text-15 text-black/50 md:mb-8 xl:mb-10 xl:max-w-111.25 xl:text-start">
              {product.description}
            </p>
            <p className="mb-8 text-18 text-black">{formatAmount(product.price)}</p>
            <div className="flex gap-4">
              <QuantitySelector value={qtyToAdd} handleChange={handleQuantityChange} />
              <Button onClick={handleAddToCart} disabled={!qtyToAdd}>
                Add To Cart
              </Button>
            </div>
          </div>
        </section>

        <section className="my-22 flex flex-col gap-22 md:my-30 md:gap-30 xl:my-40 xl:flex-row">
          <div>
            <h3 className="mb-6 text-24 text-black uppercase md:mb-8 md:text-32">Features</h3>
            <p className="max-w-172 text-15 whitespace-pre-line text-black/50 xl:max-w-158">
              {product.features}
            </p>
          </div>

          <div className="md:grid md:grid-cols-2 xl:block">
            <h3 className="mb-6 text-24 text-black uppercase md:mb-8 md:text-32">In The Box</h3>
            <ul className="grid gap-2">
              {product.includes.map((option) => (
                <li key={option.item} className="flex gap-5">
                  <span className="text-15 text-primary">{option.quantity}x</span>
                  <span className="text-15 text-black/50">{option.item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <ProductGallery gallery={product.gallery} />
        <div className="mt-30 xl:mt-40">
          <SimilarProducts products={product.others} />
        </div>
        <ShopCategories />
      </div>
    </div>
  );
};

export default ProductDetails;
