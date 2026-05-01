// src/routes/community.routes.js
const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.get('/maps',                communityController.getAllMaps);
router.get('/maps/code/:map_code', communityController.getMapByCode);
router.get('/maps/:id',            communityController.getMapById);
router.get('/maps/:id/ratings',    communityController.getMapRatings);

// Protected routes (chỉ cần đăng nhập)
router.post('/maps',               authMiddleware, communityController.createMap);
router.get('/my-maps',             authMiddleware, communityController.getMyMaps);
router.put('/maps/:id',            authMiddleware, communityController.updateMap);
router.delete('/maps/:id',         authMiddleware, communityController.deleteMap);
router.get('/history',             authMiddleware, communityController.getUserHistory);
router.post('/maps/:id/submit',    authMiddleware, communityController.submitMap);
router.post('/maps/:id/rate',      authMiddleware, communityController.rateMap);

module.exports = router;