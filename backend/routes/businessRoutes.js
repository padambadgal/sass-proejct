import express from "express";

import {
    createBusiness,
    getMyBusinesses,
    getBusinessById,
    updateBusiness,
    deleteBusiness
} from "../controllers/businessController.js";

import { protect } from "../middleware/authMiddleware.js";
import { requireActiveSubscription } from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

// GET /api/business
router.get("/", protect, requireActiveSubscription, getMyBusinesses);

// POST /api/business
router.post("/", protect, requireActiveSubscription, createBusiness);

// GET /api/business/:id
router.get("/:id", protect, requireActiveSubscription, getBusinessById);

// PATCH /api/business/:id
router.patch("/:id", protect, requireActiveSubscription, updateBusiness);

// DELETE /api/business/:id
router.delete("/:id", protect, requireActiveSubscription, deleteBusiness);

export default router;