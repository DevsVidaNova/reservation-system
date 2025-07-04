import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import {
  createRoomHandler,
  getRoomsHandler,
  getRoomByIdHandler,
  updateRoomHandler,
  deleteRoomHandler,
  searchRoomHandler,
} from "./handler.js";
dayjs.extend(customParseFormat);

// 📌 1. Criar uma nova sala
export async function createRoom(req: any, res: any) {
  const { name, size, description, exclusive, status } = req.body;
  
  // Validações obrigatórias
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Nome da sala é obrigatório.' });
  }
  
  // Validar tamanho se fornecido
  if (size !== undefined && (typeof size !== 'number' || size <= 0)) {
    return res.status(400).json({ error: 'Tamanho deve ser um número positivo.' });
  }
  
  // Validar descrição se fornecida
  if (description !== undefined && (typeof description !== 'string' || description.trim() === '')) {
    return res.status(400).json({ error: 'Descrição deve ser uma string não vazia.' });
  }
  
  // Validar exclusive se fornecido
  if (exclusive !== undefined && typeof exclusive !== 'boolean') {
    return res.status(400).json({ error: 'Exclusive deve ser um valor booleano.' });
  }
  
  // Validar status se fornecido
  if (status !== undefined && (typeof status !== 'string' || !['ativa', 'inativa', 'manutenção'].includes(status))) {
    return res.status(400).json({ error: 'Status deve ser: ativa, inativa ou manutenção.' });
  }
  
  const result = await createRoomHandler({ name, size, description, exclusive, status });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json(result.data);
}

// 📌 2. Listar todas as salas
export async function getRooms(req: any, res: any) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const result = await getRoomsHandler(page, limit);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }
  res.json({
    data: result.data,
    total: result.total,
    page: result.page,
    to: result.to,
    totalPages: result.totalPages,
    hasNext: result.hasNext,
    hasPrev: result.hasPrev
  });
}

// 📌 3. Buscar uma sala por ID
export async function getRoomById(req: any, res: any) {
  const { id } = req.params;
  const result = await getRoomByIdHandler(id);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  res.json(result.data);
}

// 📌 4. Atualizar uma sala (somente os campos enviados)
export async function updateRoom(req: any, res: any) {
  const { id } = req.params;
  const { name, size, description, exclusive, status } = req.body;
  
  // Verificar se há dados para atualizar
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Nenhum dado fornecido para atualização.' });
  }
  
  // Validar nome se fornecido
  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return res.status(400).json({ error: 'Nome da sala deve ser uma string não vazia.' });
  }
  
  // Validar tamanho se fornecido
  if (size !== undefined && (typeof size !== 'number' || size <= 0)) {
    return res.status(400).json({ error: 'Tamanho deve ser um número positivo.' });
  }
  
  // Validar descrição se fornecida
  if (description !== undefined && description !== null && (typeof description !== 'string' || description.trim() === '')) {
    return res.status(400).json({ error: 'Descrição deve ser uma string não vazia.' });
  }
  
  // Validar exclusive se fornecido
  if (exclusive !== undefined && typeof exclusive !== 'boolean') {
    return res.status(400).json({ error: 'Exclusive deve ser um valor booleano.' });
  }
  
  // Validar status se fornecido
  if (status !== undefined && (typeof status !== 'string' || !['ativa', 'inativa', 'manutenção'].includes(status))) {
    return res.status(400).json({ error: 'Status deve ser: ativa, inativa ou manutenção.' });
  }
  
  const result = await updateRoomHandler({ id, updates: req.body });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result.data);
}

// 📌 5. Deletar uma sala
export async function deleteRoom(req: any, res: any) {
  const { id } = req.params;
  const result = await deleteRoomHandler(id);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ message: "Sala deletada com sucesso." });
}

// 📌 6. Pesquisar sala
export async function searchRoom(req: any, res: any) {
  const { name } = req.query;
  
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Nome é obrigatório para busca.' });
  }
  
  const result = await searchRoomHandler(name);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  res.json(result.data);
}
