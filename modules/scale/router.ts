import express from "express";
import { requireAdmin, requireAuth } from "@/config/middleware";
import {
  createScale,
  getScales,
  getScaleById,
  updateScale,
  deleteScale,
  searchScale,
  duplicateScale
} from "./controller";

const ScaleRouter = express.Router();

ScaleRouter.route("/").post(requireAdmin, createScale);
ScaleRouter.route("/").get(requireAuth, getScales);
ScaleRouter.route("/search").put(requireAdmin, searchScale);
ScaleRouter.route("/duplicate/:id").post(requireAdmin, duplicateScale);

ScaleRouter.route("/:id").delete(requireAdmin, deleteScale);
ScaleRouter.route("/:id").put(requireAdmin, updateScale);
ScaleRouter.route("/:id").get(requireAuth, getScaleById);

export default ScaleRouter;
