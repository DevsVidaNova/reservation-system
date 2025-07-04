import { Request, Response } from "express";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import {
  createScaleHandler,
  getScalesHandler,
  getScaleByIdHandler,
  updateScaleHandler,
  deleteScaleHandler,
  searchScaleHandler,
  duplicateScaleHandler,
  ScaleInput
} from "./handler";
dayjs.extend(customParseFormat);

export async function createScale(req: any, res: any) {
  const input: ScaleInput = req.body;
  
  // Validações obrigatórias
  if (!input.date || !input.direction || !input.name) {
    return res.status(400).json({ error: "Faltam dados obrigatórios: 'date', 'name' e 'direction'." });
  }
  
  // Validação do formato da data
  if (!dayjs(input.date, 'DD/MM/YYYY', true).isValid()) {
    return res.status(400).json({ error: "Data deve estar no formato DD/MM/YYYY." });
  }
  
  // Validação se a data não é no passado
  const inputDate = dayjs(input.date, 'DD/MM/YYYY');
  if (inputDate.isBefore(dayjs(), 'day')) {
    return res.status(400).json({ error: "Data não pode ser no passado." });
  }
  
  // Validação do nome (mínimo 2 caracteres)
  if (input.name.trim().length < 2) {
    return res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres." });
  }
  
  // Validação da direção (mínimo 2 caracteres)
  if (input.direction.trim().length < 2) {
    return res.status(400).json({ error: "Direção deve ter pelo menos 2 caracteres." });
  }
  
  const result = await createScaleHandler(input);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json({ message: "Escala criada com sucesso." });
}

export async function getScales(req: any, res: any) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 15;
  const result = await getScalesHandler({ page, pageSize });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.status(200).json(result.data);
}

export async function getScaleById(req: any, res: any) {
  const { id } = req.params;
  const result = await getScaleByIdHandler(id);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  res.status(200).json(result.data);
}

export async function updateScale(req: any, res: any) {
  const { id } = req.params;
  const updates = req.body;
  
  // Validação do ID
  if (!id || id.trim() === '') {
    return res.status(400).json({ error: "ID da escala é obrigatório." });
  }
  
  // Validação se há dados para atualizar
  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "Nenhum dado fornecido para atualização." });
  }
  
  // Validação da data se fornecida
  if (updates.date && !dayjs(updates.date, 'DD/MM/YYYY', true).isValid()) {
    return res.status(400).json({ error: "Data deve estar no formato DD/MM/YYYY." });
  }
  
  // Validação se a data não é no passado
  if (updates.date) {
    const inputDate = dayjs(updates.date, 'DD/MM/YYYY');
    if (inputDate.isBefore(dayjs(), 'day')) {
      return res.status(400).json({ error: "Data não pode ser no passado." });
    }
  }
  
  // Validação do nome se fornecido
  if (updates.name && updates.name.trim().length < 2) {
    return res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres." });
  }
  
  // Validação da direção se fornecida
  if (updates.direction && updates.direction.trim().length < 2) {
    return res.status(400).json({ error: "Direção deve ter pelo menos 2 caracteres." });
  }
  
  const result = await updateScaleHandler(id, updates);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.status(200).json({ message: "Escala atualizada com sucesso." });
}

export async function deleteScale(req: any, res: any) {
  const { id } = req.params;
  const result = await deleteScaleHandler(id);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  res.status(200).json({ message: "Escala excluída com sucesso." });
}

export async function searchScale(req: any, res: any) {
  const { name } = req.body;
  
  // Validação do nome para busca
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: "Nome é obrigatório para busca." });
  }
  
  if (name.trim().length < 2) {
    return res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres para busca." });
  }
  
  const result = await searchScaleHandler(name.trim());
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  res.json(result.data);
}

export async function duplicateScale(req: any, res: any) {
  const { id } = req.params;
  
  // Validação do ID
  if (!id || id.trim() === '') {
    return res.status(400).json({ error: "ID da escala é obrigatório para duplicação." });
  }
  
  const result = await duplicateScaleHandler(id);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json(result.data);
}
