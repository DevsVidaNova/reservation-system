import dayjs from "dayjs";
import "dayjs/locale/pt.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import supabase from "../../config/supabaseClient";
import { Request, Response } from "express";

dayjs.extend(customParseFormat);
dayjs.locale("pt");

type Booking = {
  id: string;
  description: string;
  room: any;
  date: string | null;
  start_time: string;
  end_time: string;
  repeat: string | null;
  day_repeat: number | null;
  user_id: string;
  user_profiles?: any;
  rooms?: any;
};

type ProfileRequest = Request & { profile?: { id: string } };

type CreateBookingInput = {
  description: string;
  room: any;
  date: string | null;
  start_time: string;
  end_time: string;
  repeat: string | null;
  day_repeat: number | null;
};

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

// Função para validar se start_time < end_time
const isValidTimeRange = (startTime: string | null, endTime: string | null): boolean => {
  if (!startTime || !endTime) return false;
  return startTime < endTime;
};

export async function create(
  user: { id: string },
  data: CreateBookingInput,
  res: Response
): Promise<void> {
  const userId = user.id;
  const { description, room, date, start_time, end_time, repeat, day_repeat } = data;
  const sanitizedRepeat: string | null = repeat === "null" ? null : repeat;
  
  // 🔧 VALIDAÇÃO ROBUSTA: Verificar se os horários são válidos
  if (!isValidTime(start_time)) {
    res.status(400).json({ error: "Horário de início inválido. Use o formato HH:MM (ex: 09:30, 14:00)." });
    return;
  }
  
  if (!isValidTime(end_time)) {
    res.status(400).json({ error: "Horário de fim inválido. Use o formato HH:MM (ex: 10:30, 15:00)." });
    return;
  }
  
  const formattedStartTime: string | null = normalizeTime(start_time);
  const formattedEndTime: string | null = normalizeTime(end_time);
  
  // 🔧 VALIDAÇÃO ROBUSTA: Verificar se start_time < end_time
  if (!isValidTimeRange(formattedStartTime, formattedEndTime)) {
    res.status(400).json({ error: "Horário de início deve ser anterior ao horário de fim." });
    return;
  }
  
  const formattedDate: string | null = date ? dayjs(date, "DD/MM/YYYY").format("YYYY-MM-DD") : null;

  try {
    // 🔧 CORREÇÃO: Lógica de conflitos corrigida para detectar sobreposições reais
    let conflictQueries = [];
    
    if (formattedDate) {
      // Para reservas em data específica, buscar conflitos na mesma sala e data
      conflictQueries.push(
        supabase
          .from("bookings")
          .select("*")
          .eq("room", room)
          .eq("date", formattedDate)
          .lt("start_time", formattedEndTime)
          .gt("end_time", formattedStartTime)
      );
    }
    
    if (sanitizedRepeat) {
      if (sanitizedRepeat === "day") {
        // Para recorrência diária, verificar conflitos com outras reservas diárias no mesmo dia da semana
        conflictQueries.push(
          supabase.from("bookings").select("*")
            .eq("room", room)
            .eq("repeat", "day")
            .eq("day_repeat", day_repeat)
            .lt("start_time", formattedEndTime)
            .gt("end_time", formattedStartTime)
        );
      }
      if (sanitizedRepeat === "week") {
        // Para recorrência semanal, verificar conflitos com outras reservas semanais no mesmo dia
        conflictQueries.push(
          supabase.from("bookings").select("*")
            .eq("room", room)
            .eq("repeat", "week")
            .eq("day_repeat", day_repeat)
            .lt("start_time", formattedEndTime)
            .gt("end_time", formattedStartTime)
        );
      }
      if (sanitizedRepeat === "month") {
        // 🔧 CORREÇÃO: Para recorrência mensal, usar o dia do mês da data original
        const dayOfMonth = dayjs(formattedDate).date();
        conflictQueries.push(
          supabase.from("bookings").select("*")
            .eq("room", room)
            .eq("repeat", "month")
            .eq("day_repeat", dayOfMonth)
            .lt("start_time", formattedEndTime)
            .gt("end_time", formattedStartTime)
        );
      }
    }
    
    const conflictResults = await Promise.all(conflictQueries);
    const existingBookings: Booking[] = conflictResults.flatMap((result) => result.data || []);
    
    // Se encontrou alguma reserva conflitante, há conflito
    const hasConflict = existingBookings.length > 0;
    if (hasConflict) {
      res.status(400).json({ error: "Conflito de horário: já existe uma reserva nesse intervalo." });
      return;
    }
    // 🔧 CORREÇÃO: Definir day_repeat baseado no tipo de recorrência
    let finalDayRepeat = day_repeat;
    if (sanitizedRepeat === "day") {
      finalDayRepeat = dayjs(formattedDate).day(); // 0-6 (domingo-sábado)
    } else if (sanitizedRepeat === "week") {
      finalDayRepeat = dayjs(formattedDate).day(); // 0-6 (domingo-sábado)
    } else if (sanitizedRepeat === "month") {
      finalDayRepeat = dayjs(formattedDate).date(); // 1-31 (dia do mês)
    }

    const { data: bookingData, error } = await supabase
      .from("bookings")
      .insert([
        {
          description,
          room,
          date: sanitizedRepeat ? null : formattedDate,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          repeat: sanitizedRepeat,
          day_repeat: finalDayRepeat,
          user_id: userId,
        },
      ])
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json(bookingData);
  } catch (err) {
    console.error("Erro ao criar reserva:", err);
    res.status(500).json({ error: "Erro ao criar reserva" });
  }
}

export async function getBooking(req: Request, res: Response): Promise<void> {
  try {
    // 🔧 CORREÇÃO: Usar JOIN otimizado para evitar N+1 queries
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        description,
        date,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_profiles!inner(id, name, email, phone),
        rooms!inner(id, name, size)
      `);
    
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    const weekDaysAbbr = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const formattedData = (data || []).map((booking: any) => {
      const dayweek = booking.date ? parseInt(dayjs(booking.date).locale("pt").format("d")) : null;
      const repeatDay = booking.day_repeat ? weekDaysAbbr[booking.day_repeat] : null;
      const dayOfWeek = dayweek !== null ? weekDaysAbbr[dayweek] : null;
      const monthName = booking.date ? dayjs(booking.date).locale("pt").format("MMM") : null;
      return {
        id: booking.id,
        description: booking.description,
        room: booking.rooms ? {
          id: booking.rooms.id,
          name: booking.rooms.name,
          size: booking.rooms.size,
        } : null,
        date: booking.date ? dayjs(booking.date).format("DD/MM/YYYY") : null,
        day_of_week: dayOfWeek == null ? repeatDay : dayOfWeek,
        month: monthName,
        start_time: booking.start_time ? dayjs(booking.start_time, "HH:mm:ss").format("HH:mm") : null,
        end_time: booking.end_time ? dayjs(booking.end_time, "HH:mm:ss").format("HH:mm") : null,
        repeat: booking.repeat,
        repeat_day: repeatDay,
        user: booking.user_profiles ? {
          id: booking.user_profiles.id,
          name: booking.user_profiles.name,
          email: booking.user_profiles.email,
          phone: booking.user_profiles.phone,
        } : null,
      };
    });
    res.json(formattedData);
  } catch (err) {
    console.error("Erro ao buscar reservas:", err);
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
}

export async function getBookingById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        description,
        date,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_profiles(id, name, email, phone),
        rooms(id, name, size)
      `
      )
      .eq("id", id)
      .single();
    if (error || !data) {
      res.status(404).json({ error: "Reserva não encontrada" });
      return;
    }
    // Formatação dos dados pode ser implementada aqui se necessário
    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar reserva por ID:", err);
    res.status(500).json({ error: "Erro ao buscar reserva por ID" });
  }
}

export async function updateBooking(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const updateFields: Record<string, any> = {};
  
  // 🔧 VALIDAÇÃO ROBUSTA: Verificar horários antes de normalizar
  if (req.body.start_time !== undefined) {
    if (!isValidTime(req.body.start_time)) {
      res.status(400).json({ error: "Horário de início inválido. Use o formato HH:MM (ex: 09:30, 14:00)." });
      return;
    }
    updateFields.start_time = normalizeTime(req.body.start_time);
  }
  
  if (req.body.end_time !== undefined) {
    if (!isValidTime(req.body.end_time)) {
      res.status(400).json({ error: "Horário de fim inválido. Use o formato HH:MM (ex: 10:30, 15:00)." });
      return;
    }
    updateFields.end_time = normalizeTime(req.body.end_time);
  }
  
  if (req.body.description !== undefined) updateFields.description = req.body.description;
  if (req.body.room !== undefined) updateFields.room = req.body.room;
  if (req.body.date !== undefined) updateFields.date = req.body.date ? dayjs(req.body.date, "DD/MM/YYYY").format("YYYY-MM-DD") : null;
  if (req.body.repeat !== undefined) updateFields.repeat = req.body.repeat === "null" ? null : req.body.repeat;
  if (req.body.day_repeat !== undefined) updateFields.day_repeat = req.body.day_repeat;
  try {
    const { data: existingData, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !existingData) {
      res.status(404).json({ error: "Reserva não encontrada" });
      return;
    }

    // 🔧 CORREÇÃO: Validar campos obrigatórios se estiverem sendo atualizados
    const requiredFields = ['room', 'description'];
    for (const field of requiredFields) {
      const value = updateFields[field] !== undefined ? updateFields[field] : existingData[field];
      if (!value || value.toString().trim() === '') {
        res.status(400).json({ error: `Campo obrigatório: ${field}` });
        return;
      }
    }

    // 🔧 VALIDAÇÃO ROBUSTA: Verificar se a combinação de horários é válida
    const finalStartTime = updateFields.start_time !== undefined ? updateFields.start_time : existingData.start_time;
    const finalEndTime = updateFields.end_time !== undefined ? updateFields.end_time : existingData.end_time;
    
    if (!isValidTimeRange(finalStartTime, finalEndTime)) {
      res.status(400).json({ error: "Horário de início deve ser anterior ao horário de fim." });
      return;
    }

    // 🔧 CORREÇÃO: Se horário ou sala estão sendo alterados, verificar conflitos
    if (updateFields.room || updateFields.date || updateFields.start_time || updateFields.end_time || updateFields.repeat || updateFields.day_repeat) {
      const room = updateFields.room !== undefined ? updateFields.room : existingData.room;
      const date = updateFields.date !== undefined ? updateFields.date : existingData.date;
      const startTime = finalStartTime;
      const endTime = finalEndTime;
      const repeat = updateFields.repeat !== undefined ? updateFields.repeat : existingData.repeat;
      const dayRepeat = updateFields.day_repeat !== undefined ? updateFields.day_repeat : existingData.day_repeat;

      // Verificar conflitos (excluindo a própria reserva)
      let conflictQueries = [];
      
      if (date && !repeat) {
        // Para reservas em data específica, buscar conflitos na mesma sala e data
        conflictQueries.push(
          supabase
            .from("bookings")
            .select("*")
            .eq("room", room)
            .eq("date", date)
            .neq("id", id)
            .lt("start_time", endTime)
            .gt("end_time", startTime)
        );
      }
      
      if (repeat) {
        if (repeat === "day") {
          conflictQueries.push(
            supabase.from("bookings").select("*")
              .eq("room", room)
              .eq("repeat", "day")
              .eq("day_repeat", dayRepeat)
              .neq("id", id)
              .lt("start_time", endTime)
              .gt("end_time", startTime)
          );
        }
        if (repeat === "week") {
          conflictQueries.push(
            supabase.from("bookings").select("*")
              .eq("room", room)
              .eq("repeat", "week")
              .eq("day_repeat", dayRepeat)
              .neq("id", id)
              .lt("start_time", endTime)
              .gt("end_time", startTime)
          );
        }
        if (repeat === "month") {
           // 🔧 CORREÇÃO: Para recorrência mensal, usar o dia do mês correto
           const monthDayRepeat = date ? dayjs(date).date() : dayRepeat;
           conflictQueries.push(
             supabase.from("bookings").select("*")
               .eq("room", room)
               .eq("repeat", "month")
               .eq("day_repeat", monthDayRepeat)
               .neq("id", id)
               .lt("start_time", endTime)
               .gt("end_time", startTime)
           );
         }
      }
      
      if (conflictQueries.length > 0) {
        const conflictResults = await Promise.all(conflictQueries);
        const existingBookings = conflictResults.flatMap((result) => result.data || []);
        
        if (existingBookings.length > 0) {
          res.status(400).json({ error: "Conflito de horário: já existe uma reserva nesse intervalo." });
          return;
        }
      }
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch (err) {
    console.error("Erro ao atualizar reserva:", err);
    res.status(500).json({ error: "Erro ao atualizar reserva" });
  }
}

export async function deleteBooking(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id)
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ message: "Reserva deletada com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar reserva:", err);
    res.status(500).json({ error: "Erro ao deletar reserva" });
  }
}

export async function getBookingByFilter(req: Request, res: Response): Promise<void> {
  try {
    const { userId, date, room, repeat, dayRepeat } = req.body;
    let query = supabase.from("bookings").select("*");
    if (userId) query = query.eq("user_id", userId);
    if (date) query = query.eq("date", date);
    if (room) query = query.eq("room", room);
    if (repeat) query = query.eq("repeat", repeat);
    if (dayRepeat) query = query.eq("day_repeat", dayRepeat);
    const { data, error } = await query;
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    const formattedData = (data || []).map((booking: any) => ({
      id: booking.id,
      description: booking.description,
      room: booking.room,
      date: booking.date ? dayjs(booking.date).format("DD/MM/YYYY") : null,
      start_time: dayjs(booking.start_time, "HH:mm:ss").format("HH:mm"),
      end_time: dayjs(booking.end_time, "HH:mm:ss").format("HH:mm"),
      repeat: booking.repeat,
      day_repeat: booking.day_repeat,
      user_id: booking.user_id,
    }));
    res.json(formattedData);
  } catch (err) {
    console.error("Erro ao buscar reservas:", err);
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
}

export async function getBookingMy(req: ProfileRequest, res: Response): Promise<void> {
  const userId = req.profile?.id;
  if (!userId) {
    res.status(401).json({ error: "Usuário não autenticado" });
    return;
  }
  try {
    // 🔧 CORREÇÃO: Usar JOIN otimizado para evitar N+1 queries
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `id,
        description,
        date,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_profiles!inner(id, name, email, phone),  
        rooms!inner(id, name, size) `
      )
      .eq("user_id", userId);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    const weekDaysAbbr = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const formattedData = (data || []).map((booking: any) => {
      const dayweek = booking.date ? parseInt(dayjs(booking.date).locale("pt").format("d")) : null;
      const repeatDay = booking.day_repeat ? weekDaysAbbr[booking.day_repeat] : null;
      const dayOfWeek = dayweek !== null ? weekDaysAbbr[dayweek] : null;
      const monthName = booking.date ? dayjs(booking.date).locale("pt").format("MMM") : null;
      return {
        id: booking.id,
        description: booking.description,
        room: booking.rooms ? {
         id: booking.rooms.id,
         name: booking.rooms.name,
         size: booking.rooms.size,
       } : null,
        date: booking.date ? dayjs(booking.date).format("DD/MM/YYYY") : null,
        day_of_week: dayOfWeek == null ? repeatDay : dayOfWeek,
        month: monthName,
        start_time: booking.start_time ? dayjs(booking.start_time, "HH:mm:ss").format("HH:mm") : null,
        end_time: booking.end_time ? dayjs(booking.end_time, "HH:mm:ss").format("HH:mm") : null,
        repeat: booking.repeat,
        repeat_day: repeatDay,
        user: booking.user_profiles ? {
          id: booking.user_profiles.id,
          name: booking.user_profiles.name,
          email: booking.user_profiles.email,
          phone: booking.user_profiles.phone,
        } : null,
      };
    });
    res.json(formattedData);
  } catch (err) {
    console.error("Erro ao buscar reservas:", err);
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
}

export async function getBookingsByToday(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const today = dayjs().startOf("day");
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `id,
        description,
        date,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_profiles(id, name, email, phone),  
        rooms(id, name, size) `
      )
      .or(`repeat.eq.day,date.eq.${today.format("YYYY-MM-DD")}`);

    if (error) {
      res.status(400).json({ error: error.message });
      return 
    }

    // Formatação dos dados
    const formattedData = data.map((booking) => ({
      id: booking.id,
      description: booking.description,
      room: booking.rooms && booking.rooms[0]
        ? {
            id: booking.rooms[0].id,
            name: booking.rooms[0].name,
            size: booking.rooms[0].size,
          }
        : null,
      date: booking.date ? dayjs(booking.date).format("DD/MM/YYYY") : null,
      start_time: dayjs(booking.start_time, "HH:mm:ss").format("HH:mm"),
      end_time: dayjs(booking.end_time, "HH:mm:ss").format("HH:mm"),
      repeat: booking.repeat,
      day_repeat: booking.day_repeat,
      user: booking.user_profiles && booking.user_profiles[0]
        ? {
            id: booking.user_profiles[0].id,
            name: booking.user_profiles[0].name,
            email: booking.user_profiles[0].email,
            phone: booking.user_profiles[0].phone,
          }
        : null,
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Erro ao buscar reservas:", err);
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
}

export async function getBookingsByWeek(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const startOfWeek = dayjs().startOf("week"); // Início da semana atual
    const endOfWeek = dayjs().endOf("week"); // Fim da semana atual

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `id,
        description,
        date,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_profiles(id, name, email, phone),  
        rooms(id, name, size)`
      )
      .or(
        `repeat.eq.week,date.gte.${startOfWeek.format(
          "YYYY-MM-DD"
        )},date.lte.${endOfWeek.format("YYYY-MM-DD")}`
      ); // Filtra tanto as repetições semanais quanto as datas dentro da semana atual

    if (error) {
      res.status(400).json({ error: error.message });
      return 
    }

    // Mapeamento dos dias da semana abreviados
    const weekDaysAbbr = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Formatação dos dados
    const formattedData = data.map((booking) => {
      const dayweek = booking.date
        ? parseInt(dayjs(booking.date).locale("pt").format("d"))
        : null; // Obter o número do dia da semana (0-6) e garantir que seja um inteiro
      const repeatDay = booking.day_repeat
        ? weekDaysAbbr[booking.day_repeat]
        : null; // Dia da semana para repeat abreviado
      const dayOfWeek = dayweek !== null ? weekDaysAbbr[dayweek] : null; // Dia da semana abreviado
      const monthName = booking.date
        ? dayjs(booking.date).locale("pt").format("MMM")
        : null; // Nome do mês abreviado (Jan, Fev, Mar, etc.)

      return {
        id: booking.id,
        description: booking.description,
        room: booking.rooms && booking.rooms[0]
           ? {
               id: booking.rooms[0].id,
               name: booking.rooms[0].name,
               size: booking.rooms[0].size,
             }
           : null,
        date: booking.date ? dayjs(booking.date).format("DD/MM/YYYY") : null,
        day_of_week: dayOfWeek == null ? repeatDay : dayOfWeek, // Garantir que day_of_week seja retornado corretamente
        month: monthName, // Nome do mês abreviado
        start_time: dayjs(booking.start_time, "HH:mm:ss").format("HH:mm"),
        end_time: dayjs(booking.end_time, "HH:mm:ss").format("HH:mm"),
        repeat: booking.repeat,
        repeat_day: repeatDay,
        user: booking.user_profiles && booking.user_profiles[0]
          ? {
              id: booking.user_profiles[0].id,
              name: booking.user_profiles[0].name,
              email: booking.user_profiles[0].email,
              phone: booking.user_profiles[0].phone,
            }
          : null,
      };
    });

    res.json(formattedData);
  } catch (err) {
    console.error("Erro ao buscar reservas:", err);
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
}

export async function getBookingsByMonth(req: Request, res: Response) {
  try {
    const startOfMonth = dayjs().startOf("month"); // Início do mês atual
    const endOfMonth = dayjs().endOf("month"); // Fim do mês atual

    // 🔧 CORREÇÃO: Buscar reservas mensais e específicas separadamente
    const [monthlyResult, specificResult] = await Promise.all([
      // Buscar reservas com repetição mensal
      supabase
        .from("bookings")
        .select(
          `id,
          description,
          date,
          start_time,
          end_time,
          repeat,
          day_repeat,
          user_profiles(id, name, email, phone),  
          rooms(id, name, size)`
        )
        .eq("repeat", "month")
        .gte("day_repeat", 1)
        .lte("day_repeat", endOfMonth.date()),
      // Buscar reservas específicas do mês
      supabase
        .from("bookings")
        .select(
          `id,
          description,
          date,
          start_time,
          end_time,
          repeat,
          day_repeat,
          user_profiles(id, name, email, phone),  
          rooms(id, name, size)`
        )
        .gte("date", startOfMonth.format("YYYY-MM-DD"))
        .lte("date", endOfMonth.format("YYYY-MM-DD"))
        .is("repeat", null)
    ]);

    if (monthlyResult.error || specificResult.error) {
      const error = monthlyResult.error || specificResult.error;
      console.log(error);
      return res.status(400).json({ error: error?.message || 'Unknown error occurred' });
    }

    const data = [...(monthlyResult.data || []), ...(specificResult.data || [])];



    // Mapeamento dos dias da semana abreviados
    const weekDaysAbbr = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Formatação dos dados
    const formattedData = data.map((booking) => {
      const dayweek = booking.date
        ? dayjs(booking.date).locale("pt").format("d")
        : null; // Obter o número do dia da semana (0-6)
      const repeatDay = booking.day_repeat
        ? weekDaysAbbr[booking.day_repeat]
        : null; // Dia da semana para repeat abreviado
      const dayOfWeek = dayweek !== null ? weekDaysAbbr[parseInt(dayweek, 10)] : null; // Dia da semana abreviado
      const monthName = booking.date
        ? dayjs(booking.date).locale("pt").format("MMM")
        : null; // Nome do mês abreviado (Jan, Fev, Mar, etc.)

      return {
        id: booking.id,
        description: booking.description,
        room: booking.rooms && booking.rooms[0]
           ? {
               id: booking.rooms[0].id,
               name: booking.rooms[0].name,
               size: booking.rooms[0].size,
             }
           : null,
        date: booking.date ? dayjs(booking.date).format("DD/MM/YYYY") : null,
        day_of_week: dayOfWeek, // Dia da semana abreviado em pt-BR
        month: monthName, // Nome do mês abreviado
        start_time: dayjs(booking.start_time, "HH:mm:ss").format("HH:mm"),
        end_time: dayjs(booking.end_time, "HH:mm:ss").format("HH:mm"),
        repeat: booking.repeat,
        repeat_day: repeatDay, // Dia da repetição abreviado
        user: booking.user_profiles && booking.user_profiles[0]
          ? {
              id: booking.user_profiles[0].id,
              name: booking.user_profiles[0].name,
              email: booking.user_profiles[0].email,
              phone: booking.user_profiles[0].phone,
            }
          : null,
      };
    });

    res.json(formattedData);
  } catch (err) {
    console.error("Erro ao buscar reservas:", err);
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
}

export async function getBookingsOfCalendar(req: Request, res: Response) {
  try {
    // Lê os parâmetros de mês e ano da query string
    const { month, year } = req.query;

    // Caso o mês ou o ano não sejam enviados, usamos o mês e ano atuais
    const currentMonth = month ? parseInt(month.toString(), 10) : dayjs().month() + 1;
const currentYear = year ? parseInt(year.toString(), 10) : dayjs().year();

    // Determina o intervalo do mês (início e fim do mês)
    const startOfMonth = dayjs()
      .year(currentYear)
      .month(currentMonth - 1)
      .startOf("month");
    const endOfMonth = dayjs()
      .year(currentYear)
      .month(currentMonth - 1)
      .endOf("month");

    // 🔧 CORREÇÃO: Buscar reservas mensais e específicas separadamente
    const [monthlyResult, weeklyResult, specificResult] = await Promise.all([
      // Buscar reservas com repetição mensal
      supabase
        .from("bookings")
        .select(
          `id,
          description,
          date,
          start_time,
          end_time,
          repeat,
          day_repeat,
          user_profiles(id, name, email, phone),  
          rooms(id, name, size)`
        )
        .eq("repeat", "month")
        .gte("day_repeat", 1)
        .lte("day_repeat", endOfMonth.date()),
      // Buscar reservas com repetição semanal
      supabase
        .from("bookings")
        .select(
          `id,
          description,
          date,
          start_time,
          end_time,
          repeat,
          day_repeat,
          user_profiles(id, name, email, phone),  
          rooms(id, name, size)`
        )
        .eq("repeat", "week"),
      // Buscar reservas específicas do mês
      supabase
        .from("bookings")
        .select(
          `id,
          description,
          date,
          start_time,
          end_time,
          repeat,
          day_repeat,
          user_profiles(id, name, email, phone),  
          rooms(id, name, size)`
        )
        .gte("date", startOfMonth.format("YYYY-MM-DD"))
        .lte("date", endOfMonth.format("YYYY-MM-DD"))
        .is("repeat", null)
    ]);

    if (monthlyResult.error || weeklyResult.error || specificResult.error) {
      const error = monthlyResult.error || weeklyResult.error || specificResult.error;
      return res.status(400).json({ error: error?.message || 'Unknown error occurred' });
    }

    const data = [...(monthlyResult.data || []), ...(weeklyResult.data || []), ...(specificResult.data || [])];



    // Mapeamento dos dias da semana abreviados
    const weekDaysAbbr = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Formatação dos dados de eventos
    const formattedData: any[] = [];

    data.forEach((booking) => {
      // Certificando-se de que a data está no formato correto
      const formattedDate = dayjs(booking.date); // O dayjs já pode processar datas no formato "YYYY-MM-DD"

      // Verifica se a data é válida
      if (!formattedDate.isValid() && booking.repeat !== "week") {
        console.error("Data inválida:", booking.date);
        return; // Pula o evento se a data for inválida e não for repetido semanalmente
      }

      const dayweek = formattedDate.isValid()
        ? formattedDate.locale("pt").format("d")
        : null; // Obter o número do dia da semana (0-6) se a data for válida
      const repeatDay = booking.day_repeat
        ? weekDaysAbbr.indexOf(booking.day_repeat)
        : null; // Converte o nome do dia (ex: 'Seg') em um índice (0-6)
      const dayOfWeek = dayweek !== null ? weekDaysAbbr[Number(dayweek)] : null; // Dia da semana abreviado
      const monthName = formattedDate.isValid()
        ? formattedDate.locale("pt").format("MMM")
        : null; // Nome do mês abreviado (Jan, Fev, Mar, etc.)

      // Adicionando o evento principal
      formattedData.push({
        id: booking.id,
        description: booking.description,
        room: booking.rooms && booking.rooms[0]
          ? {
              id: booking.rooms[0].id,
              name: booking.rooms[0].name,
              size: booking.rooms[0].size,
            }
          : null,
        date: formattedDate.isValid()
          ? formattedDate.format("YYYY-MM-DD")
          : null,
        day_of_week: dayOfWeek, // Dia da semana abreviado em pt-BR
        month: monthName, // Nome do mês abreviado
        start_time: dayjs(booking.start_time, "HH:mm:ss").format("HH:mm"),
        end_time: dayjs(booking.end_time, "HH:mm:ss").format("HH:mm"),
        repeat: booking.repeat,
        repeat_day: booking.day_repeat, // Dia da repetição abreviado
        user: booking.user_profiles
          ? {
              id: booking.user_profiles[0].id,
              name: booking.user_profiles[0].name,
              email: booking.user_profiles[0].email,
              phone: booking.user_profiles[0].phone,
            }
          : null,
      });

      // Lógica para eventos repetidos semanalmente
      if (booking.repeat === "week" && repeatDay !== null) {
        let currentDay = startOfMonth;

        // Encontrar o primeiro dia correspondente à repetição no mês
        while (currentDay.day() !== repeatDay) {
          currentDay = currentDay.add(1, "day"); // Avança até o próximo dia que coincide com repeat_day
        }

        // Agora, atualiza a data com todas as ocorrências daquela semana para o mês atual
        while (currentDay.isBefore(endOfMonth, "day")) {
          formattedData.push({
            id: booking.id,
            description: booking.description,
            room: booking.rooms && booking.rooms[0]
               ? {
                   id: booking.rooms[0].id,
                   name: booking.rooms[0].name,
                   size: booking.rooms[0].size,
                 }
               : null,
            date: currentDay.format("DD/MM/YYYY"),
            day_of_week: weekDaysAbbr[currentDay.day()], // Dia da semana abreviado
            month: currentDay.format("MMM"), // Nome do mês abreviado
            start_time: dayjs(booking.start_time, "HH:mm:ss").format("HH:mm"),
            end_time: dayjs(booking.end_time, "HH:mm:ss").format("HH:mm"),
            repeat: booking.repeat,
            repeat_day: booking.day_repeat, // Dia da repetição abreviado
            user: booking.user_profiles && booking.user_profiles[0]
              ? {
                  id: booking.user_profiles[0].id,
                  name: booking.user_profiles[0].name,
                  email: booking.user_profiles[0].email,
                  phone: booking.user_profiles[0].phone,
                }
              : null,
          });

          // Avança para a próxima semana
          currentDay = currentDay.add(1, "week");
        }
      }
    });

    res.json(formattedData);
  } catch (err) {
    console.error("Erro ao buscar reservas:", err);
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
}

export async function searchBookingsByDescription(req: Request, res: Response) {
  const { description } = req.query;

  if (!description) {
    return res
      .status(400)
      .json({ error: "Parâmetro de busca 'description' é obrigatório." });
  }

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        description,
        date,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_profiles(id, name, email, phone),
        rooms(id, name, size)
      `
      )
      .ilike("description", `%${description}%`);

    if (error) throw error;

    const formatted = data.map((booking) => ({
      id: booking.id,
      description: booking.description,
      room: booking.rooms && booking.rooms[0] ? {
        id: booking.rooms[0].id,
        name: booking.rooms[0].name,
        size: booking.rooms[0].size,
      } : null,
      date: booking.date ? dayjs(booking.date).format("DD/MM/YYYY") : null,
      start_time: booking.start_time
        ? dayjs(booking.start_time, "HH:mm:ss").format("HH:mm")
        : null,
      end_time: booking.end_time
        ? dayjs(booking.end_time, "HH:mm:ss").format("HH:mm")
        : null,
      repeat: booking.repeat,
      day_repeat: booking.day_repeat,
      user: booking.user_profiles && booking.user_profiles[0] && {
        id: booking.user_profiles[0].id,
        name: booking.user_profiles[0].name,
        email: booking.user_profiles[0].email,
        phone: booking.user_profiles[0].phone,
      },
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Erro ao buscar reservas:", err);
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
}
