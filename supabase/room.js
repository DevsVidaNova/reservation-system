const supabase = require('../config/supabaseClient');
const express = require("express");
const middleware = require('./middleware')
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');

const router = express.Router();
dayjs.extend(customParseFormat);

// 📌 1. Criar uma nova sala
async function createRoom(req, res) {
  const { name, size, description, exclusive, status } = req.body;

  if (!name) {
    return res.status(400).json({ error: "O nome da sala é obrigatório." });
  }

  try {
    const { data, error } = await supabase
      .from("rooms")
      .insert([{ name, size, description, exclusive, status }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Erro ao criar sala:", err);
    res.status(500).json({ error: "Erro ao criar sala." });
  }
}
// 📌 2. Listar todas as salas
async function getRooms(req, res) {
  try {
    const { data, error } = await supabase.from("rooms").select("*");

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar salas:", err);
    res.status(500).json({ error: "Erro ao buscar salas." });
  }
}
// 📌 3. Buscar uma sala por ID
async function getRoomById(req, res) {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from("rooms").select("*").eq("id", id).single();

    if (error) return res.status(404).json({ error: "Sala não encontrada." });

    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar sala:", err);
    res.status(500).json({ error: "Erro ao buscar sala." });
  }
}
// 📌 4. Atualizar uma sala (somente os campos enviados)
async function updateRoom(req, res) {
  const { id } = req.params;
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from("rooms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    console.error("Erro ao atualizar sala:", err);
    res.status(500).json({ error: "Erro ao atualizar sala." });
  }
}
// 📌 5. Deletar uma sala
async function deleteRoom(req, res) {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Sala deletada com sucesso." });
  } catch (err) {
    console.error("Erro ao deletar sala:", err);
    res.status(500).json({ error: "Erro ao deletar sala." });
  }
}
// 📌 6. Pesquisar sala
async function searchRoom(req, res) {
  const { name } = req.body;
  try {
    const { data, error } = await supabase.from("rooms").select("*").ilike("name", `%${name}%`);

    if (error) return res.status(404).json({ error: "Sala não encontrada." });

    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar sala:", err);
    res.status(500).json({ error: "Erro ao buscar sala." });
  }
}

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
};

router.route("/").post(middleware.requireAdmin, createRoom);
router.route("/").get(middleware.publicRoute, getRooms); 
router.route("/search").get(middleware.publicRoute, searchRoom); 

router.route("/:id").delete(middleware.requireAdmin, deleteRoom);
router.route("/:id").get(middleware.publicRoute, getRoomById); 
router.route("/:id").put(middleware.requireAdmin, updateRoom); 


module.exports = router;
