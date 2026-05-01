// src/routes/category.routes.js
const express = require('express');
const router  = express.Router();
const categoryController = require('../controllers/Category.controller');
const {adminMiddleware } = require('../middleware/auth');

// ── Admin only (Nên đặt các route cụ thể lên trước route có :id) ──
router.post('/',         adminMiddleware, categoryController.createCategory);
router.put('/:id',       adminMiddleware, categoryController.updateCategory);
router.delete('/:id',    adminMiddleware, categoryController.deleteCategory);
router.patch('/reorder', adminMiddleware, categoryController.reorderCategories);

// ── Public ────────────────────────────────────────────────────
router.get('/',             categoryController.getAllCategories);
router.get('/:id',          categoryController.getCategoryById);
router.get('/:id/maps',     categoryController.getMapsByCategory);

module.exports = router;