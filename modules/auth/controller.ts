import { signUpUserHandler, loginUserHandler, getUserProfileHandler, updateUserProfileHandler, deleteUserHandler, logoutHandler } from "./handler";

export async function signUpUser(req: any, res: any) {
  const { email, password, name, phone } = req.body;
  
  // Validações de campos obrigatórios
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  // Validação de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Formato de email inválido." });
  }

  // Validação de senha forte
  if (password.length < 6) {
    return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres." });
  }

  // Validação de nome
  if (name.trim().length < 2) {
    return res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres." });
  }

  // Validação de telefone (se fornecido)
  if (phone && phone.trim() !== "") {
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
      return res.status(400).json({ error: "Formato de telefone inválido. Use apenas números (10-11 dígitos)." });
    }
  }

  const result = await signUpUserHandler({ email, password, name, phone });
  if (result.error) {
    return res.status(400).json({ error: result.error.message });
  }
  return res.status(201).json({ message: "Usuário registrado com sucesso", user: result.user, profile: result.profile });
}

export async function loginUser(req: any, res: any) {
  const { email, password } = req.body;
  
  // Validações de campos obrigatórios
  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios." });
  }

  // Validação de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Formato de email inválido." });
  }

  // Validação de senha não vazia
  if (password.trim() === "") {
    return res.status(400).json({ error: "Senha não pode estar vazia." });
  }

  const result = await loginUserHandler({ email, password });
  if (result.error) {
    return res.status(401).json({ error: result.error.message });
  }
  return res.json({ session: result.session, profile: result.profile });
}

export async function getUserProfile(req: any, res: any) {
  const userId = req.query.id || req.user?.id;
  if (!userId) {
    return res.status(400).json({ error: "ID do usuário não encontrado." });
  }
  if (req.role !== "admin" && req.user?.id !== userId) {
    return res.status(403).json({ error: "Acesso restrito. Somente administradores podem acessar perfis de outros usuários." });
  }
  const result = await getUserProfileHandler(userId);
  if (result.error) {
    return res.status(400).json({ error: result.error.message });
  }
  return res.json(result.profileData);
}

export async function updateUserProfile(req: any, res: any) {
  const userId = req.query.id || req.user?.id;
  
  // Validação de ID do usuário
  if (!userId) {
    return res.status(400).json({ error: "ID do usuário não encontrado." });
  }

  // Validação de permissão
  if (req.role !== "admin" && req.user?.id !== userId) {
    return res.status(403).json({ error: "Acesso restrito. Somente administradores podem acessar perfis de outros usuários." });
  }

  const { name, phone } = req.body;

  // Validação de dados de atualização
  if (!name && !phone) {
    return res.status(400).json({ error: "Pelo menos um campo deve ser fornecido para atualização." });
  }

  // Validação de nome (se fornecido)
  if (name && name.trim().length < 2) {
    return res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres." });
  }

  // Validação de telefone (se fornecido)
  if (phone && phone.trim() !== "") {
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
      return res.status(400).json({ error: "Formato de telefone inválido. Use apenas números (10-11 dígitos)." });
    }
  }

  const result = await updateUserProfileHandler(userId, { name, phone });
  if (result.error) {
    return res.status(400).json({ error: result.error.message });
  }
  return res.json({ message: "Perfil atualizado com sucesso", profile: result.profile });
}

export async function deleteUser(req: any, res: any) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(400).json({ error: "ID do usuário não encontrado." });
  }
  const result = await deleteUserHandler(userId);
  if (result.error) {
    return res.status(400).json({ error: result.error.message });
  }
  return res.json({ message: "Usuário e perfil excluídos com sucesso." });
}

export async function logout(req: any, res: any) {
  const result = await logoutHandler();
  if (result.error) {
    return res.status(400).json({ error: result.error.message });
  }
  return res.json({ message: "Logout realizado com sucesso." });
}
