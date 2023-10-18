import ProductCard from '@/components/ProductCard';
import { getAllProducts } from '@/lib/actions'
import React from 'react'

const Products = async () => {

  const allProducts = await getAllProducts();

  // console.log('getAllProducts() allProducts :>> ', allProducts);

  return (
    <div>
      <section className='trending-section'>
        <h2 className='section-text'>Trending</h2>
        <div className='flex flex-wrap gap-x-8 gap-y-16'>
          {allProducts?.map((product) => (
            <ProductCard key={product._id} product={product}/>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Products