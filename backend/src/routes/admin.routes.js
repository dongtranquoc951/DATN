// src/routes/admin.routes.js
const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserStats,
  getUserById,
  banUser,
  unbanUser,
  updateUserRole,
  deleteUser,
} = require("../controllers/admin.user.controller");

const {
  getAllMaps,
  getMapStats,
  getMapById,
  togglePublishMap,
  deleteMap,
  deleteRating,
} = require("../controllers/admin.map.controller");

const {
  getAllLevels,
  getLevelStats,
  getLevelById,
  createLevel,
  updateLevel,
  togglePublishLevel,
  deleteLevel,
} = require("../controllers/admin.level.controller");

// ──────────────────────────────────────
// USER ROUTES
// ──────────────────────────────────────
router.get("/users/stats",       getUserStats);
router.get("/users",             getAllUsers);
router.get("/users/:id",         getUserById);
router.patch("/users/:id/ban",   banUser);
router.patch("/users/:id/unban", unbanUser);
router.patch("/users/:id/role",  updateUserRole);
router.delete("/users/:id",      deleteUser);

// ──────────────────────────────────────
// MAP ROUTES
// ──────────────────────────────────────
router.get("/maps/stats",                    getMapStats);
router.get("/maps",                          getAllMaps);
router.get("/maps/:id",                      getMapById);
router.patch("/maps/:id/publish",            togglePublishMap);
router.delete("/maps/:id",                   deleteMap);
router.delete("/maps/:id/ratings/:ratingId", deleteRating);

// ──────────────────────────────────────
// LEVEL ROUTES
// ──────────────────────────────────────
router.get("/levels/stats",          getLevelStats);
router.get("/levels",                getAllLevels);
router.get("/levels/:id",            getLevelById);
router.post("/levels",               createLevel);
router.put("/levels/:id",            updateLevel);
router.patch("/levels/:id/publish",  togglePublishLevel);
router.delete("/levels/:id",         deleteLevel);

module.exports = router;