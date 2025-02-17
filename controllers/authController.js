const User = require("../models/user");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwtUtils");

const register = async (req, res, next) => {
  const { email, password, name, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email e senha obrigatorios." });
  }

  if (password.length < 4) {
    return res
      .status(400)
      .json({ message: "Senha deve ter pelo menos 4 caracteres" });
  }
  if (!name || !phone) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Usuário já existe" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
    });

    res.status(201).json({
      message: "Usuário criado com sucesso!",
      user: { id: newUser._id, email: newUser.email, name: newUser.name },
    });
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    res.status(500).json({
      message: "Erro ao criar usuário.",
      error: err.message,
    });
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Nome de usuário ou senha não fornecidos.",
    });
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        message: "Erro ao realizar login",
        error: "Usuário não encontrado",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Erro ao realizar login",
        error: "Senha incorreta",
      });
    }

    const token = generateToken(
      user._id,
      user.isAdmin,
      user.phone,
      user.name,
      user.email
    );

    res.status(200).json({
      message: "Login com sucesso",
      token,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(400).json({
      message: "Ocorreu um erro",
      error: err.message,
    });
  }
};

const deleteUser = async (req, res, next) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "ID do usuário não fornecido" });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    await user.remove();

    res.status(200).json({
      message: "Usuário deletado com sucesso",
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({
      message: "Erro ao deletar usuário",
      error: error.message,
    });
  }
};

const mongoose = require("mongoose");

const editUser = async (req, res) => {
  const { id } = req.body;
  const { name, phone, email } = req.body;

  if (!id || !name || !phone || !email) {
    return res.status(400).json({
      message: "Todos os campos (id, name, phone, email) são obrigatórios.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID inválido." });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    user.name = name;
    user.phone = phone;
    user.email = email;

    await user.save();

    res.status(200).json({
      message: "Usuário atualizado com sucesso",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ message: "Erro ao atualizar usuário." });
  }
};

module.exports = { register, login, deleteUser, editUser };
