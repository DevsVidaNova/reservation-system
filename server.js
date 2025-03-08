import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import roomRoutes from "./controller/room.js";
import bookingRoutes from "./controller/booking.js";
import authRoutes from "./controller/auth.js";
import analyticsRoutes from "./controller/analytics.js";
import userRoutes from "./controller/user.js";
import scaleRoutes from "./controller/scale.js";
import membersRoutes from "./controller/members.js";


const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(cors());

app.use("/auth", authRoutes);

app.use("/room", roomRoutes);
app.use("/booking", bookingRoutes);
app.use("/user", userRoutes);

app.use("/scale", scaleRoutes);
app.use("/members", membersRoutes);
app.use("/analytics", analyticsRoutes);


app.get("/ping", (req, res) => {
  return res.status(200).send("Pong");
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`);
});
