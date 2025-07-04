import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  showUserHandler,
  listUsersHandler,
  deleteUserHandler,
  updateUserHandler,
  createUserHandler,
  listUsersScaleHandler
} from "./handler";

dayjs.extend(customParseFormat);

export async function showUser(req: any, res: any) {
  const { id } = req.params;
  const result = await showUserHandler(id);
  if (result.error) {
    return res.status(404).json({ message: result.error });
  }
  return res.status(200).json(result.data);
}

export async function listUsers(req: any, res: any) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await listUsersHandler(page, limit);
  if (result.error) {
    return res.status(500).json({ message: result.error });
  }
  return res.status(200).json(result.data);
}

export async function deleteUser(req: any, res: any) {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ error: "ID do usuário não encontrado." });
  }
  const result = await deleteUserHandler(userId);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ message: "Usuário e perfil excluídos com sucesso." });
}

export async function updateUser(req: any, res: any) {
  const userId = req.params.id;
  const { name, phone, email, role } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "ID do usuário não encontrado." });
  }
  
  // Verificar se há dados para atualizar
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Nenhum dado fornecido para atualização.' });
  }
  
  // Validar nome se fornecido
  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return res.status(400).json({ error: 'Nome deve ser uma string não vazia.' });
  }
  
  // Validar telefone se fornecido
  if (phone !== undefined) {
    if (typeof phone !== 'string' || phone.trim() === '') {
      return res.status(400).json({ error: 'Telefone deve ser uma string não vazia.' });
    }
    const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Formato de telefone inválido.' });
    }
  }
  
  // Validar e-mail se fornecido
  if (email !== undefined) {
    if (typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'E-mail deve ser uma string não vazia.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de e-mail inválido.' });
    }
  }
  
  // Validar role se fornecido
  if (role !== undefined && !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Role deve ser: user ou admin.' });
  }
  
  const result = await updateUserHandler({ userId, name, phone, email, role });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ message: "Perfil atualizado com sucesso", profile: result.data });
}

export async function createUser(req: any, res: any) {
  const { name, phone, role, password, email } = req.body;
  
  // Validações obrigatórias
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Nome é obrigatório.' });
  }
  
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    return res.status(400).json({ error: 'Telefone é obrigatório.' });
  }
  
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'E-mail é obrigatório.' });
  }
  
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' });
  }
  
  // Validar formato de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Formato de e-mail inválido.' });
  }
  
  // Validar formato de telefone (brasileiro)
  const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Formato de telefone inválido.' });
  }
  
  // Validar role se fornecido
  if (role && !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Role deve ser: user ou admin.' });
  }
  
  const result = await createUserHandler({ name, phone, role, password, email });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  return res.status(201).json({ message: "Usuário criado com sucesso.", user: result.data });
}

export async function listUsersScale(req: any, res: any) {
  const result = await listUsersScaleHandler();
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }
  return res.status(200).json(result.data);
}
