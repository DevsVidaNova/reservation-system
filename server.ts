import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import RoomRouter from "@/modules/room/router";
import BookingRouter from "@/modules/booking/router";
import AuthRouter from '@/modules/auth/router';
import UserRouter from "./modules/user/router";
import MembersRouter from "./modules/members/router";
import ScaleRouter from "./modules/scale/router";
import AnalyticsRouter from "./modules/analytics/router";

const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(cors());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.use("/room", RoomRouter);
app.use("/booking", BookingRouter);
app.use("/auth", AuthRouter);
app.use("/user", UserRouter);
app.use("/members", MembersRouter);
app.use("/scale", ScaleRouter);
app.use("/analytics", AnalyticsRouter);


app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`);
});
