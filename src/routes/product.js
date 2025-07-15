const express = require("express");
const Product = require("../models/Product");
const { authenticate, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// List products (with optional search and pagination)
router.get("/", async (req, res) => {
  const { page = 1, limit = 10, search = "", category = "" } = req.query;
  const where = {};
  if (search) where.name = { $like: `%${search}%` };
  if (category) where.category = category;
  try {
    const products = await Product.findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit: parseInt(limit),
    });
    res.json({
      products: products.rows,
      total: products.count,
      page: parseInt(page),
      totalPages: Math.ceil(products.count / limit),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: err.message });
  }
});

// Get product by id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch product", error: err.message });
  }
});

// Add product (admin only)
router.post("/", authenticate, authorizeRole("admin"), async (req, res) => {
  const { name, price, category, description } = req.body;
  try {
    const product = await Product.create({
      name,
      price,
      category,
      description,
    });
    res.status(201).json(product);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to add product", error: err.message });
  }
});

// Update product (admin only)
router.put("/:id", authenticate, authorizeRole("admin"), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await product.update(req.body);
    res.json(product);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update product", error: err.message });
  }
});

// Delete product (admin only)
router.delete(
  "/:id",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      await product.destroy();
      res.json({ message: "Product deleted" });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Failed to delete product", error: err.message });
    }
  }
);

module.exports = router;
