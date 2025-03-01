const supabase = require('../config/supabaseClient');
const translateError = require('./../utils/errors');
const express = require("express");
const middleware = require('./middleware');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');

const router = express.Router();
dayjs.extend(customParseFormat);

// 📌 1. Criar um novo membro
async function createMember(req, res) {
  const { full_name, birth_date, gender, cpf, rg, phone, email, street, number, neighborhood, city, state, cep, mother_name, father_name, marital_status, has_children, children_count, available_days, available_hours, interests, skills, health_restrictions, previous_volunteering, previous_volunteering_place } = req.body;

  if (!full_name || !birth_date || !gender || !phone || !email) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  try {
    const { data, error } = await supabase
      .from("members")
      .insert([{ full_name, birth_date, gender, cpf, rg, phone, email, street, number, neighborhood, city, state, cep, mother_name, father_name, marital_status, has_children, children_count, available_days, available_hours, interests, skills, health_restrictions, previous_volunteering, previous_volunteering_place }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Erro ao criar membro:", err);
    res.status(500).json({ code: err.code, message: translateError(err) });
  }
}

// 📌 2. Listar todos os membros
async function getMembers(req, res) {
  try {
    const { data, error } = await supabase.from("members").select("*");

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar membros:", err);
    res.status(500).json({ error: "Erro ao buscar membros." });
  }
}

// 📌 3. Buscar um membro por ID
async function getMemberById(req, res) {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from("members").select("*").eq("id", id).single();

    if (error) return res.status(404).json({ error: "Membro não encontrado." });

    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar membro:", err);
    res.status(500).json({ error: "Erro ao buscar membro." });
  }
}

// 📌 4. Atualizar um membro (somente os campos enviados)
async function updateMember(req, res) {
  const { id } = req.params;
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    console.error("Erro ao atualizar membro:", err);
    res.status(500).json({ error: "Erro ao atualizar membro." });
  }
}

// 📌 5. Deletar um membro
async function deleteMember(req, res) {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Membro deletado com sucesso." });
  } catch (err) {
    console.error("Erro ao deletar membro:", err);
    res.status(500).json({ error: "Erro ao deletar membro." });
  }
}

// 📌 6. Pesquisar membro pelo nome
async function searchMember(req, res) {
  const { full_name } = req.body;
  try {
    const { data, error } = await supabase.from("members").select("*").ilike("full_name", `%${full_name}%`);

    if (error) return res.status(404).json({ error: "Membro não encontrado." });

    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar membro:", err);
    res.status(500).json({ error: "Erro ao buscar membro." });
  }
}

// 📌 7. Buscar com filtros genéricos
async function searchByFilter(req, res) {
  const { table, field, value } = req.body;

  if (!table || !field || value === undefined) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  try {
    const { data, error } = await supabase.from(table).select("*").eq(field, value);

    if (error) return res.status(404).json({ error: "Nenhum resultado encontrado." });

    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar com filtro:", err);
    res.status(500).json({ error: "Erro ao buscar com filtro." });
  }
}

// 📌 0. Rotas com Middleware
router.route("/").post(middleware.requireAdmin, createMember);
router.route("/").get(middleware.publicRoute, getMembers);
router.route("/search").get(middleware.publicRoute, searchMember);
router.route("/filter").post(middleware.publicRoute, searchByFilter);

router.route("/:id").delete(middleware.requireAdmin, deleteMember);
router.route("/:id").get(middleware.publicRoute, getMemberById);
router.route("/:id").put(middleware.requireAdmin, updateMember);

module.exports = router;
