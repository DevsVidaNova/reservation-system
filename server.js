import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";

import roomRoutes from "./supabase/room.js";
import bookingRoutes from "./supabase/booking.js";
import authRoutes from "./supabase/auth.js";
import analyticsRoutes from "./supabase/analytics.js";
import userRoutes from "./supabase/user.js";
import scaleRoutes from "./supabase/scale.js";
import membersRoutes from "./supabase/members.js";

dotenv.config();

const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(cors());

app.use("/room", roomRoutes);
app.use("/booking", bookingRoutes);
app.use("/auth", authRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/user", userRoutes);
app.use("/scale", scaleRoutes);
app.use("/members", membersRoutes);


app.get("/ping", (req, res) => {
  return res.status(200).send("Pong");
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`);
});
