import express from "express";
import { requireAdmin } from "@/config/middleware";
import {
  showUser,
  listUsers,
  deleteUser,
  updateUser,
  createUser,
  listUsersScale
} from "./controller";

const UserRouter = express.Router();

UserRouter.route("/").post(requireAdmin, createUser);
UserRouter.route("/").get(requireAdmin, listUsers);
UserRouter.route("/scale").get(requireAdmin, listUsersScale);
UserRouter.route("/:id").get(requireAdmin, showUser);
UserRouter.route("/:id").delete(requireAdmin, deleteUser);
UserRouter.route("/:id").put(requireAdmin, updateUser);

export default UserRouter;
