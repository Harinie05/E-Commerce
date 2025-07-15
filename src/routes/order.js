const express = require("express");
const { authenticate } = require("../middleware/auth");
const { Cart, CartItem, Product, Order } = require("../models");

const router = express.Router();

// Place order from cart
router.post("/place", authenticate, async (req, res) => {
  try {
    console.log("[DEBUG] Placing order for user:", req.user.id);
    // Find user's active cart
    const cart = await Cart.findOne({
      where: { userId: req.user.id, status: "active" },
    });
    if (!cart) {
      console.log("[DEBUG] No active cart found for user:", req.user.id);
      return res.status(404).json({ message: "No active cart found" });
    }
    const items = await CartItem.findAll({
      where: { cartId: cart.id },
      include: Product,
    });
    if (!items.length) {
      console.log("[DEBUG] Cart is empty for user:", req.user.id);
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate total
    let total = 0;
    items.forEach((item) => {
      total += item.quantity * (item.Product ? item.Product.price : 0);
    });

    // Create order
    const order = await Order.create({
      userId: req.user.id,
      total,
      status: "pending",
    });
    console.log("[DEBUG] Order created:", order.id, "for user:", req.user.id);

    // Optionally, you could create an OrderItem table for order details
    // For now, just return order and items

    // Mark cart as ordered
    cart.status = "ordered";
    await cart.save();

    res.status(201).json({ order, items });
  } catch (err) {
    console.error("[DEBUG] Failed to place order:", err);
    res
      .status(500)
      .json({ message: "Failed to place order", error: err.message });
  }
});

// (Optional) Get all orders for user
router.get("/", authenticate, async (req, res) => {
  try {
    console.log("[DEBUG] Fetching orders for user:", req.user.id);
    const orders = await Order.findAll({ where: { userId: req.user.id } });
    console.log("[DEBUG] Orders found:", orders.length);
    res.json(orders);
  } catch (err) {
    console.error("[DEBUG] Failed to fetch orders:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch orders", error: err.message });
  }
});

module.exports = router;
