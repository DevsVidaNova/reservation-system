import express from "express";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import supabase from "../config/supabaseClient.js";
import middleware from "./middleware.js";

const router = express.Router();
dayjs.extend(customParseFormat);

const outputs = "id, name, phone, role, user_id, email";

// 📌 1. Mostrar um usuario
const showUser = async (req, res) => {
    const { id } = req.params;
    try {
        let query = supabase.from("user_profiles").select(outputs);
        const { data: user, error } = await query.eq("id", id).single();
        if (error || !user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error("Erro ao buscar usuário:", err);
        res.status(500).json({ message: "Erro ao buscar dados do usuário." });
    }
};

// 📌 2. Listar usuarios
const listUsers = async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from("user_profiles")
            .select(outputs);

        if (error) {
            console.log(error);
            return res.status(400).json({ message: "Erro ao buscar usuários." });
        }

        res.status(200).json(users);
    } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        res.status(500).json({ message: "Erro ao buscar usuários." });
    }
};

// 📌 3. Deletar um usuario
const deleteUser = async (req, res) => {
    const userId = req.params.id
    if (!userId) {
        return res.status(400).json({ error: 'ID do usuário não encontrado.' });
    }
    try {
        const { error: profileError } = await supabase
            .from('user_profiles')
            .delete()
            .eq('user_id', userId);

        if (profileError) {
            console.error('Erro ao excluir perfil:', profileError.message);
            return res.status(400).json({ error: profileError.message });
        }
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
            console.error('Erro ao excluir usuário:', authError.message);
            return res.status(400).json({ error: authError.message });
        }
        return res.json({ message: 'Usuário e perfil excluídos com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir usuário:', err);
        return res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
}

// 📌 3. Atualizar um usuario
const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { name, phone, email, role,  } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'ID do usuário não encontrado.' });
    }
    try {
        const { data: user, error: fetchError } = await supabase
            .from("user_profiles")
            .select("name, phone, email, role")
            .eq("user_id", userId)
            .single();

        
        if (fetchError || !user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }
        const updates = {
            name: name ?? user.name,
            phone: phone ?? user.phone,
            email: email ?? user.email,
            role: role ?? user.role,
            updated_at: new Date(),
        };
        const { data, error: updateError } = await supabase
            .from("user_profiles")
            .update(updates)
            .eq("user_id", userId)
            .select();

        
        console.log(data)
        if (updateError) {
            console.error("Erro ao atualizar perfil:", updateError.message);
            return res.status(400).json({ error: updateError.message });
        }
        return res.json({
            message: "Perfil atualizado com sucesso",
            profile: updates,
        });
    } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
        return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
};

// 📌 4. Criar um usuario
const createUser = async (req, res) => { 
    const { name, phone, role, password, email } = req.body; // Sem email aqui, pois você não quer usar o email no processo
    console.log(req.body)
    if (!name || !phone || !email || !password) { 
        return res.status(400).json({ error: "Dados inválidos." });
    }
    try {
        const { data: user, session, error } = await supabase.auth.admin.createUser({
            email, 
            password,
            email_confirm: false,
        });

        if (error) {
            console.error("Erro ao criar usuário:", error);
            return res.status(400).json({ error: "Erro ao criar usuário." });
        }

        const { data, error: profileError } = await supabase
            .from("user_profiles")
            .insert({ name, phone, email, role, user_id: user.user.id })
            .single();

        if (profileError) {
            console.error("Erro ao criar perfil:", profileError);
            return res.status(400).json({ error: "Erro ao criar perfil." });
        }

        res.status(201).json({
            message: "Usuário criado com sucesso.",
            user: { name, email, phone, role, user_id: user.user.id },
        });
    } catch (err) {
        console.error("Erro ao criar usuário:", err);
        res.status(500).json({ error: "Erro ao criar usuário." });
    }
};

// 📌 0. Rotas com Middleware
router.route("/").post(middleware.requireAdmin, createUser);
router.route("/").get(middleware.requireAdmin, listUsers);
router.route("/:id").get(middleware.requireAdmin, showUser);
router.route("/:id").delete(middleware.requireAdmin, deleteUser);
router.route("/:id").put(middleware.requireAdmin, updateUser);

export default router;
