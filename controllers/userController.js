const User = require("../models/user");

const showUser = async (req, res) => {
  const { id } = req.params;
  const loggedInUserId = req.userId;

  if (loggedInUserId !== id && !req.isAdmin) {
    return res.status(403).json({ message: "sem permissão! " });
  }

  try {
    const userQuery = User.findById(id);

    if (req.isAdmin || loggedInUserId === id) {
      const user = await userQuery.select("+password +email");

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const userData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: user.password,
      };

      return res.status(200).json(userData);
    } else {
      const user = await userQuery.select("-password", "+email");

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const userData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
      };

      return res.status(200).json(userData);
    }
  } catch (err) {
    console.error("Erro ao buscar usuario:", err);
    res.status(500).json({ message: "Erro ao buscar dados do usuario." });
  }
};
const listUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.status(200).json(users);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
};
module.exports = { showUser, listUsers };
