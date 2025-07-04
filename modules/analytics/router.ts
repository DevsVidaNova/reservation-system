import express from "express";
import {requireAdmin} from "@/config/middleware";
import { getStats } from "./controller";

const AnalyticsRouter = express.Router();

AnalyticsRouter.route("/").get(requireAdmin, getStats);

export default AnalyticsRouter;