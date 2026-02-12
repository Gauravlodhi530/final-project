// controllers/product.controller.js
const Product = require("../models/product.model");
const mongoose = require("mongoose");
const imageKitService = require("../services/imagekit.service");
const {
  uploadImages,
  handleUploadError,
} = require("../services/upload.service");


// Create Product Controller
const createProduct = async (req, res) => {
  try {
    let { title, description, price, priceCurrency, stock } = req.body;

    const seller = req.user.id;

    // Parse price if it's a JSON string (from multipart/form-data)
    if (typeof price === 'string') {
      try {
        price = JSON.parse(price);
      } catch (e) {
        // If parsing fails, it's not JSON, keep as is
      }
    }

    // Parse price - handle both object format { amount, currency } and number/string format
    let priceData;
    if (typeof price === 'object' && price !== null && price.amount !== undefined) {
      // Price is in object format: { amount, currency }
      priceData = {
        amount: Number(price.amount),
        currency: price.currency || priceCurrency || "INR",
      };
    } else {
      // Price is a number or string
      priceData = {
        amount: Number(price),
        currency: priceCurrency || "INR",
      };
    }

    // Upload images using ImageKit service
    let images = await Promise.all(
      (req.files || []).map(async (file) => {
        const uploadResult = await imageKitService.uploadImage(file.buffer);
        // Map ImageKit response to model format
        return {
          url: uploadResult.url,
          thumbnail: uploadResult.thumbnailUrl,
          id: uploadResult.fileId,
        };
      })
    );

    // Create product
    const product = await Product.create({
      title,
      description,
      price: priceData,
      seller,
      images,
      stock: stock ? Number(stock) : 0,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Product creation error:", error);
    // Handle validation errors from Mongoose (e.g., enum validation)
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', '),
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

// Get All Products Controller
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      message: "Products fetched successfully",
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

const getProducts = async(req, res) => {
   
  const {q, minPrice, maxPrice, skip = 0, limit = 20} = req.query;

  const filter = {};
  
  if(q) {
    filter.$or = [
      { title: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') }
    ];
  }
  if(minPrice){
    filter['price.amount'] = {...filter['price.amount'], $gte: Number(minPrice)};
  }
  if(maxPrice){
    filter['price.amount'] = {...filter['price.amount'], $lte: Number(maxPrice)};
  }
  const products = await Product.find(filter)
    .sort({ _id: 1 })
    .skip(Number(skip))
    .limit(Math.min(Number(limit), 20));

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products,
    });

}


async function getProductById(req, res) {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);

    if(!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product: product
    });
  } catch (error) {
    // Handle invalid ObjectId or other database errors
    return res.status(404).json({
      success: false,
      message: "Product not found"
    });
  }
}

// Update Product Controller
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if(product.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "forbidden: " });
    }

    const { title, description, price, stock } = req.body;

    if (title) product.title = title;
    if (description) product.description = description;
    if (stock !== undefined) product.stock = Number(stock);

    if (price !== undefined) {
      let { amount, currency } = product.price;

      if (typeof price === "object") {
        if (price.amount !== undefined) amount = Number(price.amount);
        if (price.currency) currency = price.currency;
      } else {
        const parsed = Number(price);
        if (!isNaN(parsed)) amount = parsed;
      }

      product.price = { amount, currency };
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error(error);
  }
}

// Delete Product Controller
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden: You can only delete your own products" });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to delete product" });
  }
}

async function getProductsBySeller(req, res){

  const seller = req.user
  const { skip = 0, limit = 20 } = req.query

  const products = await Product.find({ seller: seller.id}).skip(skip).limit(Math.min(Number(limit), 20))

  return res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: products,
  })
}



module.exports = {
  createProduct,
  getAllProducts,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsBySeller
};
