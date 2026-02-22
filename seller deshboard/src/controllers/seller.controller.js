const orderModel = require("../models/order.model");
const productModel = require("../models/product.model");
const paymentModel = require("../models/payment.models");

async function getMetrics(req, res) {
    try {
        const seller = req.user;
        const sellerId = seller._id;

        // Get all products for this seller
        const products = await productModel.find({ seller: sellerId });
        const productIds = products.map(p => p._id);

        // Get all orders containing seller's products
        const orders = await orderModel.find({
            "items.product": { $in: productIds }
        });

        // Get completed payments for seller's products
        const payments = await paymentModel.find({
            productId: { $in: productIds.map(id => id.toString()) },
            status: "completed"
        });

        // Calculate total sales (number of orders)
        const totalSales = orders.length;

        // Calculate total revenue from completed payments
        const totalRevenue = payments.reduce((sum, payment) => {
            return sum + (payment.price?.amount || 0);
        }, 0);

        // Calculate total products
        const totalProducts = products.length;

        // Calculate pending orders
        const pendingOrders = orders.filter(order => order.status === "pending").length;

        return res.status(200).json({
            metrics: {
                totalSales,
                totalRevenue,
                totalProducts,
                pendingOrders
            }
        });
    } catch (error) {
        console.error("Error fetching metrics:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getSales(req, res) {
    try {
        const seller = req.user;
        const sellerId = seller._id;

        // Get all products for this seller
        const products = await productModel.find({ seller: sellerId });
        const productIds = products.map(p => p._id);

        // Get all orders containing seller's products
        const orders = await orderModel.find({
            "items.product": { $in: productIds }
        }).populate("items.product").sort({ createdAt: -1 });

        // Calculate sales data
        const salesData = orders.map(order => {
            const sellerItems = order.items.filter(item => 
                productIds.some(id => id.equals(item.product._id))
            );
            
            const orderTotal = sellerItems.reduce((sum, item) => {
                return sum + (item.price?.amount || 0) * item.quantity;
            }, 0);

            return {
                orderId: order._id,
                date: order.createdAt,
                status: order.status,
                items: sellerItems.length,
                total: orderTotal,
                currency: sellerItems[0]?.price?.currency || "INR"
            };
        });

        return res.status(200).json({ sales: salesData });
    } catch (error) {
        console.error("Error fetching sales:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getRevenue(req, res) {
    try {
        const seller = req.user;
        const sellerId = seller._id;

        // Get all products for this seller
        const products = await productModel.find({ seller: sellerId });
        const productIds = products.map(p => p._id);

        // Get completed payments for seller's products
        const payments = await paymentModel.find({
            productId: { $in: productIds.map(id => id.toString()) },
            status: "completed"
        }).sort({ createdAt: -1 });

        // Calculate revenue by period
        const revenueData = payments.reduce((acc, payment) => {
            const date = new Date(payment.createdAt);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!acc[monthYear]) {
                acc[monthYear] = {
                    period: monthYear,
                    amount: 0,
                    currency: payment.price?.currency || "INR",
                    count: 0
                };
            }
            
            acc[monthYear].amount += payment.price?.amount || 0;
            acc[monthYear].count += 1;
            
            return acc;
        }, {});

        const revenue = Object.values(revenueData).sort((a, b) => b.period.localeCompare(a.period));

        return res.status(200).json({ revenue });
    } catch (error) {
        console.error("Error fetching revenue:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getTopProducts(req, res) {
    try {
        const seller = req.user;
        const sellerId = seller._id;

        // Get all products for this seller
        const products = await productModel.find({ seller: sellerId });
        const productIds = products.map(p => p._id);

        // Get all orders containing seller's products
        const orders = await orderModel.find({
            "items.product": { $in: productIds }
        }).populate("items.product");

        // Calculate product sales
        const productSales = {};
        
        orders.forEach(order => {
            order.items.forEach(item => {
                if (productIds.some(id => id.equals(item.product._id))) {
                    const productId = item.product._id.toString();
                    
                    if (!productSales[productId]) {
                        productSales[productId] = {
                            product: item.product,
                            totalQuantity: 0,
                            totalRevenue: 0
                        };
                    }
                    
                    productSales[productId].totalQuantity += item.quantity;
                    productSales[productId].totalRevenue += (item.price?.amount || 0) * item.quantity;
                }
            });
        });

        // Sort by quantity and get top products
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, 10)
            .map(item => ({
                productId: item.product._id,
                title: item.product.title,
                image: item.product.images?.[0]?.url || null,
                totalQuantity: item.totalQuantity,
                totalRevenue: item.totalRevenue,
                currency: item.product.price?.currency || "INR"
            }));

        return res.status(200).json({ topProducts });
    } catch (error) {
        console.error("Error fetching top products:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getOrders(req, res) {
    try{
        const seller = req.user;
        const orders = await orderModel.find({ sellerId: seller._id });
        return res.status(200).json({ orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}
async function getProducts(req, res) {
    try {
        const seller = req.user;
        const products = await productModel.find({ seller: seller._id });
        return res.status(200).json({ products });
    } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    getMetrics,
    getMatrics: getMetrics, // Alias for backward compatibility
    getSales,
    getRevenue,
    getTopProducts,
    getOrders,
    getProducts
};