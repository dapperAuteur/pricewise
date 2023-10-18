"use client"

import { scrapeAndStoreProduct } from '@/lib/actions';
import React, { FormEvent, useState } from 'react'

const isValidAmazonProductURL = (url: string) => {
  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname;

    // Check if hostname contains 
    if (hostname.includes('amazon.com') ||
      hostname.includes('amazon.') ||
      hostname.endsWith('amazon')) {
      return true;
    }
  } catch (err) {
    console.log('err :>> ', err);
    return false
  }
  return false;
}

const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValidLink = isValidAmazonProductURL(searchPrompt);
    
    if (!isValidLink) {
      return alert('Please provide a valid Amazon link.')
    }
    try {
      setIsLoading(true);
      // scrape product
      const product = await scrapeAndStoreProduct(searchPrompt);
      // console.log('product :>> ', product);
    } catch (err) {
      console.log('err :>> ', err);
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <form
      className='flex flex-wrap gap-4 mt-12'
      onSubmit={handleSubmit}>
        <input
          value={searchPrompt}
          onChange={(e) =>setSearchPrompt(e.target.value)}
          type='text'
          placeholder='Enter product link'
          className='searchbar-input'/>
          <button
            type='submit'
            className="searchbar-btn"
            disabled={searchPrompt === ''}>
              {isLoading ? 'Search...' : 'Search'}
          </button>
    </form>
  )
}

export default Searchbar