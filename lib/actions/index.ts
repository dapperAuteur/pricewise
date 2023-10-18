"use server"

import { scrapeAmazonProduct } from "../scraper";
import { connectToDB } from "../mongoose";
import Product from "../model/product.model";
import { getLowestPrice, getHighestPrice, getAveragePrice } from "../utils";
import { revalidatePath } from "next/cache";
import { generateEmailBody, sendEmail } from "../nodemailer";
import { User } from "@/types";

export async function scrapeAndStoreProduct(productUrl:string) {
  if (!productUrl) return;

  try {

    connectToDB();
    const scrapedProduct = await scrapeAmazonProduct(productUrl);
    if (!scrapedProduct) return;

    let product = scrapedProduct;

    const existingProduct = await Product.findOne({
      url: scrapedProduct.url
    });

    if (existingProduct) {
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        {
          price: scrapedProduct.currentPrice
        }
      ]

      product = {
        ...scrapedProduct,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory)
      }
    }

    const newProduct = await Product.findOneAndUpdate({
      url: scrapedProduct.url
    },
      product,
      {
        upsert: true,
        new: true
      }
    );

    revalidatePath(`/products/${newProduct._id}`);

  } catch (err: any) {
    console.log('err :>> ', err);
    throw new Error(`Failed to create/update product: ${err.message}`)
  }
  
}

export async function getProductById(productId:String) {
  try {
    connectToDB();

    const product = await Product.findOne({
      _id: productId
    });

    // console.log('getProductById(productId:String) product :>> ', product);

    if(!product) return null;
    return product;
  } catch (err) {
    console.log('getProductById(productId:String) err :>> ', err);
  }
}

export async function getAllProducts() {
  
  try {
    connectToDB();

    const products = await Product.find();

    // console.log('getAllProducts() products :>> ', products);
    return products;
  } catch (err) {
    console.log('getAllProducts() err :>> ', err);
  }
}

export async function getSimilarProducts(productId: string) {
  
  try {
    connectToDB();

    const currentProduct = await Product.findById(productId);

    if(!currentProduct) return null;
    
    const similarProducts = await Product.find({
      _id: {$ne: productId},
    }).limit(3);

    return similarProducts;
  } catch (err) {
    console.log('getSimilarProducts(productId: string) err :>> ', err);
  }
}

export async function addUserEmailToProduct(productId:string, userEmail:string) {
  
  try {
    // Send our first email...!
    const product = await Product.findById(productId);
    
    if(!product) return;

    const userExists = product.users.some((user: User) => user.email === userEmail);

    if(!userExists){
      product.users.push({email: userEmail});

      await product.save();

      const emailContent = await generateEmailBody(product, "WELCOME");

      // console.log('addUserEmailToProduct() emailContent :>> ', emailContent);

      await sendEmail(emailContent, [userEmail]);
    }
  } catch (err) {
    console.log('addUserEmailToProduct(productId:string, userEmail:string) err :>> ', err);
  }
}