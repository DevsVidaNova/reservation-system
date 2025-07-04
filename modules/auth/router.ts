import { Router } from "express";
import { requireAdmin, publicRoute, requireAuth } from "@/config/middleware";
import { signUpUser, loginUser, deleteUser, getUserProfile, logout, updateUserProfile } from "./controller";
const AuthRouter = Router();

AuthRouter.route("/register").post(requireAdmin, signUpUser); 
AuthRouter.route("/login").post(publicRoute, loginUser); 
AuthRouter.route("/delete").delete(requireAuth, deleteUser); 
AuthRouter.route("/profile").get(requireAuth,  getUserProfile); 
AuthRouter.route("/edit").put(requireAuth, updateUserProfile); 
AuthRouter.route("/logout").post(requireAuth, logout); 

export default AuthRouter;