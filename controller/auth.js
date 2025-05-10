import express from "express";
import supabase from "../config/supabaseClient.js";
import middleware from "./middleware.js";
import { createSupabaseAnonClient } from "../config/supabaseAnonClient.js";

const router = express.Router();

// 📌 1. Registrar de usuário
async function signUpUser(req, res) {
  const { email, password, name, phone } = req.body;

  const { data: user, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name, 
      }
    }
  },
  );

  if (error) {
    console.error('Erro ao registrar usuário:', error.message);
    return res.status(400).json({ error: error.message });
  }

  // Criar um perfil de usuário após o registro
  const { data, error: profileError } = await supabase
    .from('user_profiles')
    .insert([
      {
        user_id: user.id,
        name,
        phone,
        email,
        role: 'user',
        is_admin: false,
      },
    ]);

  if (profileError) {
    console.error('Erro ao criar perfil:', profileError.message);
    return res.status(400).json({ error: profileError.message });
  }

  console.log('Usuário registrado com sucesso e perfil criado!');
  return res.status(201).json({ message: 'Usuário registrado com sucesso', user });
}

// 📌 2. Login de usuário
async function loginUser(req, res) {
  const userClient = createSupabaseAnonClient()
  const { email, password } = req.body;
  try {
    const { data: session, error } = await userClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erro ao fazer login:', error.message);
      return res.status(401).json({ error: error.message });
    }

    // Obter perfil do usuário após login
    const { data: profile, error: profileError } = await userClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (profileError) {
      console.error('Erro ao obter perfil:', profileError.message);
      return res.status(400).json({ error: profileError.message });
    }

    return res.json({ session, profile });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro ao fazer login.' });
  }
}

// 📌 3. Obter perfil do usuário
async function getUserProfile(req, res) {
  const userId = req.query.id || req.user.id;
  if (req.role !== 'admin' && req.user.id !== userId) {
    return res.status(403).json({ error: 'Acesso restrito. Somente administradores podem acessar perfis de outros usuários.' });
  }
  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário não encontrado.' });
  }
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.log(profileError)
      console.error('Erro ao obter perfil:', profileError.message);
      return res.status(400).json({ error: profileError.message });
    }
    return res.json( profileData );
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    return res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
}
// 📌 4. Atualizar perfil do usuário apenas NAME E PHONE
async function updateUserProfile(req, res) {
  const userId = req.query.id || req.user.id;

  if (req.role !== 'admin' && req.user.id !== userId) {
    return res.status(403).json({ error: 'Acesso restrito. Somente administradores podem acessar perfis de outros usuários.' });
  }

  const { name, phone } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário não encontrado.' });
  }
  try {
    const { data, error: updateError } = await supabase
      .from('user_profiles')
      .update({ name, phone, updated_at: new Date() })
      .eq('user_id', userId)
      .select();
    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError.message);
      return res.status(400).json({ error: updateError.message });
    }
    return res.json({ message: 'Perfil atualizado com sucesso', profile: data[0] });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
};

// 📌 5. Deletar usuário
async function deleteUser(req, res) {
  const userId = req.user.id;
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

//📌 6. Logout do user
async function logout(req, res) {
  const userClient = createSupabaseAnonClient()
  const { error } = await userClient.auth.signOut();

  if (error) {
    console.error('Erro ao fazer logout:', error.message);
    return res.status(400).json({ error: error.message });
  }

  return res.json({ message: 'Logout realizado com sucesso.' });
}

// 📌 0. Rotas com Middleware
router.route("/register").post(middleware.requireAdmin, signUpUser); // Rota admin

router.route("/login").post(middleware.publicRoute, loginUser); // Rota pública, sem autenticação necessária

router.route("/delete").delete(middleware.requireAuth, deleteUser); // Precisa de autenticação e admin

router.route("/profile").get(middleware.requireAuth,  getUserProfile); // Precisa apenas de autenticação

router.route("/edit").put(middleware.requireAuth, updateUserProfile); // Precisa apenas de autenticação

router.route("/logout").post(middleware.requireAuth, logout); // Precisa apenas de autenticação

export default router;