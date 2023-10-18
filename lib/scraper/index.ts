"use server"

import axios from "axios";
import * as cheerio from 'cheerio';
import { extractCurrency, extractDescription, extractPrice } from "../utils";

export async function scrapeAmazonProduct(url:string) {
  if (!url) return;
  // BrightData proxy configuration
  const username= String(process.env.BRIGHT_DATA_USERNAME);
  const password= String(process.env.BRIGHT_DATA_PASSWORD);

  const port = 22225;
  const session_id = (1000000 * Math.random()) | 0;
  
  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: 'brd.superproxy.io',
    port,
    rejectUnauthorized: false,
  }

  try {
    // Fetch the product page.

    const response = await axios.get(url, options);
    // console.log('response.data :>> ', response.data);
    const $ = cheerio.load(response.data);

    // extract the product title
    const title = $('#productTitle').text().trim();
    // console.log('title :>> ', title);
    const currentPrice = extractPrice(
      $('.priceToPay span.a-price-whole'),
      $('.a.size.base.a-color-price'),
      $('.a-button-selected .a-color-base')
    );
    // console.log('currentPrice :>> ', currentPrice);

    const originalPrice = extractPrice(
      $('#priceblock_ourprice'),
      $('.a-price.a-text-price span.a-offscreen'),
      $('#listPrice'),
      $('#priceblock_dealprice'),
      $('.a-size-base.a-color-price')
    );
    // console.log('originalPrice :>> ', originalPrice);
    
    const myPrice = extractPrice(
      $('span.a-offscreen')
    );
    // console.log('myPrice :>> ', myPrice);

    const outOfStock = $('#availability span').text().trim().toLocaleLowerCase() === 'currently unavailable';
    // console.log('outOfStock :>> ', outOfStock);

    const images = 
      $('#imgBlkFront').attr('data-a-dynamic-image') ||
      $('#landingImage').attr('data-a-dynamic-image') ||
      '{}';
    // console.log('image :>> ', images);

    const imageUrls = Object.keys(JSON.parse(images));
    // console.log('imageUrls :>> ', imageUrls);

    const currency = extractCurrency($('.a-price-symbol'));
    // console.log('currency :>> ', currency);

    const discountRate = $('.savingsPercentage').text().replace(/[-%]/g,'');
    // console.log('discountRate :>> ', discountRate);

    const description = extractDescription($);
    // console.log('description :>> ', description);

    // Construct data object with scraped info
    const data = {
      url,
      currency: currency || '$',
      image: imageUrls[0],
      title,
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      category: 'category',
      reviewsCount: 100,
      stars: 4.5,
      isOutOfStock: outOfStock,
      description,
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(originalPrice) || Number(currentPrice)
    }
    console.log('data :>> ', data);
    return data;
  } catch (err: any) {
    console.log('err :>> ', err);
    throw new Error(`Failed to scrape product: ${err.message}`)
    
  }
}