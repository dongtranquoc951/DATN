const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learning.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Public routes
router.get('/levels', learningController.getAllLevels);
router.get('/levels/:id', learningController.getLevelById);

// Protected routes (cần login)
router.get('/progress', authMiddleware, learningController.getUserProgress);
router.post('/levels/:id/submit', authMiddleware, learningController.submitLevel);

// Admin routes
router.post('/levels', authMiddleware, adminMiddleware, learningController.createLevel);
router.put('/levels/:id', authMiddleware, adminMiddleware, learningController.updateLevel);
router.delete('/levels/:id', authMiddleware, adminMiddleware, learningController.deleteLevel);

module.exports = router;