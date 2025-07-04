import { Router } from "express";
import { requireAdmin } from "@/config/middleware";
import {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  searchMember,
  searchByFilter,
  getAnalytics
} from "./controller";

const MembersRouter = Router();

MembersRouter.post("/", requireAdmin, createMember);
MembersRouter.get("/", requireAdmin, getMembers);
MembersRouter.get("/:id", requireAdmin, getMemberById);
MembersRouter.put("/:id", requireAdmin, updateMember);
MembersRouter.delete("/:id", requireAdmin, deleteMember);
MembersRouter.post("/search", requireAdmin, searchMember);
MembersRouter.post("/filter", requireAdmin, searchByFilter);
MembersRouter.get("/analytics", requireAdmin, getAnalytics);

export default MembersRouter;
