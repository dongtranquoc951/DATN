// src/routes/category.routes.js
const express = require('express');
const router  = express.Router();
const categoryController = require('../controllers/Category.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth'); // ← thêm authMiddleware

// ── Admin only ────────────────────────────────────────────────
router.post('/',         authMiddleware, adminMiddleware, categoryController.createCategory);
router.put('/:id',       authMiddleware, adminMiddleware, categoryController.updateCategory);
router.delete('/:id',    authMiddleware, adminMiddleware, categoryController.deleteCategory);
router.patch('/reorder', authMiddleware, adminMiddleware, categoryController.reorderCategories);

// ── Public ────────────────────────────────────────────────────
router.get('/',          categoryController.getAllCategories);
router.get('/:id',       categoryController.getCategoryById);
router.get('/:id/maps',  categoryController.getMapsByCategory);

module.exports = router;