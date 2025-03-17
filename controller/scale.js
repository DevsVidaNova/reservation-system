import express from "express";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import supabase from "../config/supabaseClient.js";
import middleware from "./middleware.js";

const router = express.Router();
dayjs.extend(customParseFormat);

// 📌 1. Criar uma nova escala
async function createScale(req, res) {
    const { date, band, name, projection, light, transmission, camera, live, sound, training_sound, photography, stories, dynamic, direction } = req.body;
    if (!date || !direction || !name) {
        return res.status(400).json({ error: "Faltam dados obrigatórios: 'date', 'band', 'projection','name', ou 'direction'." });
    }

    try {
        const formattedDate = dayjs(date, 'DD/MM/YYYY').format('YYYY-MM-DD');
        if (!dayjs(formattedDate).isValid()) {
            return res.status(400).json({ error: "Data inválida." });
        }

        const { error: insertError } = await supabase
            .from("scales")
            .insert([{ date: formattedDate, name, band, projection, light, transmission, camera, live, sound, training_sound, photography, stories, dynamic, direction }]);

        if (insertError) {
            return res.status(400).json({ error: insertError.message });
        }

        res.status(201).json({ message: "Escala criada com sucesso." });
    } catch (err) {
        res.status(500).json({ error: "Erro ao criar escala." });
    }
}

// 📌 2. Listar todas as escalas
async function getScales(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 15;
        const offset = (page - 1) * pageSize;

        const { data, error, count } = await supabase
            .from("scales")
            .select(`
                id,
                date,
                name,
                description,
                direction:direction(id, full_name), 
                band:band(id, full_name) 
            `, { count: "exact" })
            .range(offset, offset + pageSize - 1);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({
            scales: data,
            pagination: {
                total: count,
                page,
                pageSize,
                totalPages: Math.ceil(count / pageSize),
            }
        });
    } catch (err) {
        console.error("Erro ao listar escalas:", err);
        res.status(500).json({ error: "Erro ao listar escalas." });
    }
}

// 📌 3. Buscar uma escala por ID
async function getScaleById(req, res) {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from("scales")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            return res.status(404).json({ error: "Escala não encontrada." });
        }

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar escala." });
    }
}

// 📌 4. Atualizar uma escala
async function updateScale(req, res) {
    const { id } = req.params;
    const updates = req.body;

    try {
        const { error } = await supabase.from("scales").update(updates).eq("id", id);
        if (error) return res.status(400).json({ error: error.message });

        res.status(200).json({ message: "Escala atualizada com sucesso." });
    } catch (err) {
        res.status(500).json({ error: "Erro ao atualizar escala." });
    }
}

// 📌 5. Deletar uma escala
async function deleteScale(req, res) {
    const { id } = req.params;
    try {
        const { error } = await supabase.from("scales").delete().eq("id", id);
        if (error) return res.status(404).json({ error: "Escala não encontrada." });

        res.status(200).json({ message: "Escala excluída com sucesso." });
    } catch (err) {
        res.status(500).json({ error: "Erro ao excluir escala." });
    }
}

// 📌 6. Pesquisar escala
async function searchScale(req, res) {
    const { name } = req.body;
    try {
        const { data, error } = await supabase.from("scales").select("*").ilike("name", `%${name}%`);
        if (error) return res.status(404).json({ error: "Escala não encontrada." });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar escala." });
    }
}

// 📌 7. Duplicar escala
async function duplicateScale(req, res) {
    const { id } = req.params;
    try {
        const { data: originalScale, error } = await supabase.from("scales").select("*").eq("id", id).single();
        if (error || !originalScale) return res.status(404).json({ error: "Escala não encontrada." });

        delete originalScale.id;
        originalScale.name += " (duplicado)";

        const { data: duplicatedScale, error: insertError } = await supabase.from("scales").insert([originalScale]).select().single();
        if (insertError) return res.status(400).json({ error: "Erro ao duplicar escala." });

        res.status(201).json(duplicatedScale);
    } catch (err) {
        res.status(500).json({ error: "Erro ao duplicar escala." });
    }
}

// 📌 0. Rotas com Middleware
router.route("/").post(middleware.requireAdmin, createScale);
router.route("/").get(middleware.requireAuth, getScales);
router.route("/search").put(middleware.requireAdmin, searchScale);
router.route("/duplicate/:id").post(middleware.requireAdmin, duplicateScale);

router.route("/:id").delete(middleware.requireAdmin, deleteScale);
router.route("/:id").put(middleware.requireAdmin, updateScale);
router.route("/:id").get(middleware.requireAuth, getScaleById);

export default router;
