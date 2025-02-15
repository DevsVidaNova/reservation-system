const supabase = require('../config/supabaseClient');
const middleware = require('./middleware')
const express = require("express");
const router = express.Router();

async function getStats(req, res) {
    try {

        const { count: roomsCount, error: roomsError } = await supabase
            .from("rooms")
            .select("*", { count: "exact", head: true });

        const { count: bookingsCount, error: bookingsError } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true });

        const { count: usersCount, error: usersError } = await supabase
            .from("user_profiles")
            .select("*", { count: "exact", head: true });

        if (roomsError || bookingsError || usersError) {
            return res.status(400).json({
                message: "Erro ao buscar estatísticas.",
                errors: { roomsError, bookingsError, usersError },
            });
        }

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekISO = lastWeek.toISOString().split("T")[0]; // Formata para YYYY-MM-DD

        const { count: weeklyBookingsCount, error: weekError } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .gte("date", lastWeekISO);

        if (weekError) {
            return res.status(400).json({ message: "Erro ao buscar reservas semanais." });
        }

        res.status(200).json({
            rooms: roomsCount || 0,
            bookings: bookingsCount || 0,
            users: usersCount || 0,
            week: weeklyBookingsCount || 0,
        });
    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        res.status(500).json({ message: "Erro ao obter estatísticas." });
    }
};

router.route("/").get(middleware.requireAdmin, getStats); 

module.exports = router;