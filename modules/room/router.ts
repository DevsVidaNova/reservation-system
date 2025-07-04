import { Router } from "express";
import { requireAdmin, publicRoute } from "@/config/middleware";
import { createRoom, getRooms, searchRoom, deleteRoom, getRoomById, updateRoom } from "./controller";
const RoomRouter = Router();

RoomRouter.route("/").post(requireAdmin, createRoom);
RoomRouter.route("/").get(publicRoute, getRooms); 
RoomRouter.route("/search").get(publicRoute, searchRoom); 

RoomRouter.route("/:id").delete(requireAdmin, deleteRoom);
RoomRouter.route("/:id").get(publicRoute, getRoomById); 
RoomRouter.route("/:id").put(requireAdmin, updateRoom); 

export default RoomRouter;
