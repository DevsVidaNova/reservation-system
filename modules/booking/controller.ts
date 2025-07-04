import { Request, Response, NextFunction } from "express";
import * as handler from './handler';

const normalizeTime = (time: string | undefined | null): string | null => {
  if (!time) return null;
  
  // Remover espaços em branco
  const cleanTime = time.trim();
  
  // Verificar se o formato básico está correto (H:M, HH:MM ou HH:MM:SS)
  const timeRegex = /^([0-9]|[0-1][0-9]|2[0-3]):([0-9]|[0-5][0-9])(:([0-5][0-9]))?$/;
  if (!timeRegex.test(cleanTime)) {
    return null; // Horário inválido
  }
  
  const parts = cleanTime.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
  
  // Validar ranges
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return null; // Horário inválido
  }
  
  // Formatar com zero à esquerda e adicionar segundos se necessário
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  
  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};

// Função para validar se um horário é válido
const isValidTime = (time: string | undefined | null): boolean => {
  return normalizeTime(time) !== null;
};

// 📌 1. Criar uma nova reserva
export const createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { description, room, date, start_time, end_time, repeat, day_repeat } = req.body;
  
  // 🔧 CORREÇÃO: Validações mais robustas
  // Validar campos obrigatórios
  if (!description || typeof description !== 'string' || description.trim() === '') {
    res.status(400).json({ error: 'Descrição é obrigatória e deve ser um texto válido.' });
    return;
  }
  
  if (!room || typeof room !== 'string' || room.trim() === '') {
    res.status(400).json({ error: 'Sala é obrigatória e deve ser um texto válido.' });
    return;
  }
  
  if (!start_time || !end_time) {
    res.status(400).json({ error: 'Horários de início e fim são obrigatórios.' });
    return;
  }
  
  // 🔧 VALIDAÇÃO ROBUSTA: Verificar se os horários são válidos
  if (!isValidTime(start_time)) {
    res.status(400).json({ error: 'Horário de início inválido. Use o formato HH:MM (ex: 09:30, 14:00). Horários devem estar entre 00:00 e 23:59.' });
    return;
  }
  
  if (!isValidTime(end_time)) {
    res.status(400).json({ error: 'Horário de fim inválido. Use o formato HH:MM (ex: 10:30, 15:00). Horários devem estar entre 00:00 e 23:59.' });
    return;
  }
  
  const formattedStartTime = normalizeTime(start_time);
  const formattedEndTime = normalizeTime(end_time);
  
  // Validar lógica de horários (já sabemos que são válidos pelas verificações anteriores)
  if (formattedStartTime && formattedEndTime && formattedStartTime >= formattedEndTime) {
    res.status(400).json({ error: 'Horário de início deve ser anterior ao horário de fim.' });
    return;
  }
  
  // Validar recorrência
  const validRepeats = ['none', 'day', 'week', 'month', null, undefined];
  if (repeat && !validRepeats.includes(repeat)) {
    res.status(400).json({ error: 'Tipo de recorrência inválido. Use: none, day, week ou month.' });
    return;
  }
  
  // Validar data para reservas não recorrentes
  if ((!repeat || repeat === 'none' || repeat === 'null') && !date) {
    res.status(400).json({ error: 'Data é obrigatória para reservas não recorrentes.' });
    return;
  }
  
  // Validar day_repeat para recorrências
  if (repeat && repeat !== 'none' && repeat !== 'null') {
    if (repeat === 'day' || repeat === 'week') {
      if (day_repeat === undefined || day_repeat < 0 || day_repeat > 6) {
        res.status(400).json({ error: 'Para recorrência diária/semanal, day_repeat deve ser entre 0-6 (domingo-sábado).' });
        return;
      }
    } else if (repeat === 'month') {
      if (day_repeat === undefined || day_repeat < 1 || day_repeat > 31) {
        res.status(400).json({ error: 'Para recorrência mensal, day_repeat deve ser entre 1-31 (dia do mês).' });
        return;
      }
    }
  }

  try {
    const user = (req as any).profile || { id: (req as any).user?.id };
    await handler.create(user, req.body, res);
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao criar reserva.' });
  }
};

// 📌 2. Listar todas reservas
export async function getBooking(req: Request, res: Response): Promise<void> {
  return handler.getBooking(req, res);
}

// 📌 3. Pegar reserva por ID
export async function getBookingById(req: Request, res: Response): Promise<void> {
  return handler.getBookingById(req, res);
}

// 📌 4. Atualizar reserva
export async function updateBooking(req: Request, res: Response): Promise<void> {
  if (Object.keys(req.body).length === 0) {
    res.status(400).json({ error: "Nenhum campo válido enviado para atualização" });
    return;
  }
  
  // 🔧 CORREÇÃO: Validações para atualização
  const { description, room, date, start_time, end_time, repeat, day_repeat } = req.body;
  
  // Validar tipos de dados se fornecidos
  if (description !== undefined && (typeof description !== 'string' || description.trim() === '')) {
    res.status(400).json({ error: 'Descrição deve ser um texto válido.' });
    return;
  }
  
  if (room !== undefined && (typeof room !== 'string' || room.trim() === '')) {
    res.status(400).json({ error: 'Sala deve ser um texto válido.' });
    return;
  }
  
  // 🔧 VALIDAÇÃO ROBUSTA: Validar horários se fornecidos
  if (start_time !== undefined || end_time !== undefined) {
    if (start_time !== undefined && !isValidTime(start_time)) {
      res.status(400).json({ error: 'Horário de início inválido. Use o formato HH:MM (ex: 09:30, 14:00). Horários devem estar entre 00:00 e 23:59.' });
      return;
    }
    
    if (end_time !== undefined && !isValidTime(end_time)) {
      res.status(400).json({ error: 'Horário de fim inválido. Use o formato HH:MM (ex: 10:30, 15:00). Horários devem estar entre 00:00 e 23:59.' });
      return;
    }
    
    // Se ambos os horários estão sendo atualizados, validar lógica
    const formattedStartTime = start_time ? normalizeTime(start_time) : null;
    const formattedEndTime = end_time ? normalizeTime(end_time) : null;
    
    if (formattedStartTime && formattedEndTime && formattedStartTime >= formattedEndTime) {
      res.status(400).json({ error: 'Horário de início deve ser anterior ao horário de fim.' });
      return;
    }
  }
  
  // Validar recorrência se fornecida
  if (repeat !== undefined) {
    const validRepeats = ['none', 'day', 'week', 'month', null];
    if (repeat && !validRepeats.includes(repeat)) {
      res.status(400).json({ error: 'Tipo de recorrência inválido. Use: none, day, week ou month.' });
      return;
    }
  }
  
  // Validar day_repeat se fornecido
  if (day_repeat !== undefined && repeat !== undefined && repeat !== 'none' && repeat !== null) {
    if ((repeat === 'day' || repeat === 'week') && (day_repeat < 0 || day_repeat > 6)) {
      res.status(400).json({ error: 'Para recorrência diária/semanal, day_repeat deve ser entre 0-6.' });
      return;
    }
    if (repeat === 'month' && (day_repeat < 1 || day_repeat > 31)) {
      res.status(400).json({ error: 'Para recorrência mensal, day_repeat deve ser entre 1-31.' });
      return;
    }
  }
  
  return handler.updateBooking(req, res);
}

// 📌 5. Deletar reserva
export async function deleteBooking(req: Request, res: Response): Promise<void> {
  return handler.deleteBooking(req, res);
}

// 📌 6. Buscar com filtro
export const getBookingByFilter = async (req: Request, res: Response): Promise<void> => {
  return handler.getBookingByFilter(req, res);
};

// 📌 7. Listar minhas reservas
export async function getBookingMy(req: Request, res: Response): Promise<void> {
  return handler.getBookingMy(req, res);
}

// 📌 8. Listar reservas para hoje
export async function getBookingsByToday(req: Request, res: Response): Promise<void> {
  return handler.getBookingsByToday(req, res);
}

// 📌 9. Listar reservas para semana
export async function getBookingsByWeek(req: Request, res: Response): Promise<void> {
  return handler.getBookingsByWeek(req, res);
}

// 📌 10. Buscar reservas por descrição
export async function searchBookingsByDescription(req: Request, res: Response): Promise<void> {
  await handler.searchBookingsByDescription(req, res);
}
