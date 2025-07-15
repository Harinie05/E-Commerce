const express = require("express");
const { authenticate } = require("../middleware/auth");
const { Cart, CartItem, Product } = require("../models");

const router = express.Router();

// Get current user's active cart (create if not exists)
router.get("/", authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({
      where: { userId: req.user.id, status: "active" },
    });
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id });
    }
    const items = await CartItem.findAll({
      where: { cartId: cart.id },
      include: Product,
    });
    res.json({ cart, items });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch cart", error: err.message });
  }
});

// Add item to cart
router.post("/add", authenticate, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({
      where: { userId: req.user.id, status: "active" },
    });
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id });
    }
    let item = await CartItem.findOne({
      where: { cartId: cart.id, productId },
    });
    if (item) {
      item.quantity += quantity;
      await item.save();
    } else {
      item = await CartItem.create({ cartId: cart.id, productId, quantity });
    }
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to add item", error: err.message });
  }
});

// Update item quantity
router.put("/update", authenticate, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({
      where: { userId: req.user.id, status: "active" },
    });
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    let item = await CartItem.findOne({
      where: { cartId: cart.id, productId },
    });
    if (!item)
      return res.status(404).json({ message: "Item not found in cart" });
    item.quantity = quantity;
    await item.save();
    res.json(item);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update item", error: err.message });
  }
});

// Remove item from cart
router.delete("/remove", authenticate, async (req, res) => {
  const { productId } = req.body;
  try {
    let cart = await Cart.findOne({
      where: { userId: req.user.id, status: "active" },
    });
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    let item = await CartItem.findOne({
      where: { cartId: cart.id, productId },
    });
    if (!item)
      return res.status(404).json({ message: "Item not found in cart" });
    await item.destroy();
    res.json({ message: "Item removed from cart" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to remove item", error: err.message });
  }
});

module.exports = router;
