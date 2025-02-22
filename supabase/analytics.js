const supabase = require('../config/supabaseClient');
const middleware = require('./middleware')
const express = require("express");
const router = express.Router();
const dayjs = require('dayjs');

// 📌 1. Analytics das salas
async function getStats(req, res) {
    try {
      const countResults = await Promise.all([
        getCount("rooms"),
        getCount("bookings"),
        getCount("user_profiles"),
      ]);
  
      const [roomsCount, bookingsCount, usersCount] = countResults;
  
      if (roomsCount.error || bookingsCount.error || usersCount.error) {
        return res.status(400).json({
          message: "Erro ao buscar estatísticas.",
          errors: {
            roomsError: roomsCount.error,
            bookingsError: bookingsCount.error,
            usersError: usersCount.error,
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
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ message: "Erro ao obter estatísticas." });
    }
  }
  

// 📌 0. Rotas com Middleware
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

router.route("/").get(middleware.requireAdmin, getStats); 

module.exports = router;