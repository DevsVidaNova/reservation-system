import express from "express";
import dayjs from "dayjs";
import supabase from "../config/supabaseClient.js";
import middleware from "./middleware.js";

const router = express.Router();

// 📌 1. Analytics geral
async function getStats(req, res) {
    try {
      const countResults = await Promise.all([
        getCount("rooms"),
        getCount("bookings"),
        getCount("user_profiles"),
        getCount("members")
      ]);
  
      const [roomsCount, bookingsCount, usersCount, membersCount] = countResults;
  
      if (roomsCount.error || bookingsCount.error || usersCount.error || membersCount.error) {
        return res.status(400).json({
          message: "Erro ao buscar estatísticas.",
          errors: {
            roomsError: roomsCount.error,
            bookingsError: bookingsCount.error,
            usersError: usersCount.error,
            membersError: membersCount.error
          },
        });
      }
  
      const lastWeekISO = dayjs().subtract(7, "days").format("YYYY-MM-DD");
  
      const { count: weeklyBookingsCount, error: weekError } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("date", lastWeekISO);
  
      if (weekError) {
        return res.status(400).json({ message: "Erro ao buscar reservas semanais." });
      }
  
      res.status(200).json({
        rooms: roomsCount.count || 0,
        bookings: bookingsCount.count || 0,
        users: usersCount.count || 0,
        week: weeklyBookingsCount || 0,
        members: membersCount.count || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ message: "Erro ao obter estatísticas." });
    }
  }
  
// 📌 2. Função para contar registros
async function getCount(tableName) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });
  
      return { count, error };
    } catch (err) { 
      return { error: err.message };
    }
}
  
// 📌 0. Rotas com Middleware
router.route("/").get(middleware.requireAdmin, getStats);

export default router;