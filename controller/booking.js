import express from "express";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import supabase from "../config/supabaseClient.js";
import middleware from "./middleware.js";

const router = express.Router();
dayjs.extend(customParseFormat);

// 📌 1. Criar uma nova reserva
async function createBooking(req, res) {
  const userId = req.profile.id;
  const { description, room, date, start_time, end_time, repeat, day_repeat } = req.body;

  if (!description || !room || !start_time || !end_time) { 
    return res.status(400).json({ error: 'Campos não foram enviados.' });
  }
  if (!repeat && !date)  {
    return res.status(400).json({ error: 'Data é obrigatória, a menos que a reserva seja repetida.' });
  }
  if (start_time >= end_time || start_time === end_time || end_time <= start_time) {
    return res.status(400).json({ error: 'Os horários são invalidos.' });
  }

  const formattedDate = dayjs(date, 'DD/MM/YYYY').format('YYYY-MM-DD');

  try {
    let conflictQueries = [];

    if (formattedDate) {
      conflictQueries.push(
        supabase.from('bookings').select('*')
          .eq('room', room)
          .eq('date', formattedDate)  
          .gte('start_time', start_time)
          .lte('end_time', end_time)
      );
    }

    if (repeat) {
      if (repeat === 'day') {
        conflictQueries.push(
          supabase.from('bookings').select('*')
            .eq('room', room)
            .eq('repeat', 'day')
            .eq('day_repeat', day_repeat) 
            .gte('start_time', start_time)
            .lte('end_time', end_time)
        );
      }

      if (repeat === 'week') {
        conflictQueries.push(
          supabase.from('bookings').select('*')
            .eq('room', room)
            .eq('repeat', 'week')  
            .eq('day_repeat', day_repeat)  
            .gte('start_time', start_time)
            .lte('end_time', end_time)
        );
      }
      if (repeat === 'month') {
        conflictQueries.push(
          supabase.from('bookings').select('*')
            .eq('room', room)
            .eq('repeat', 'month') 
            .eq('day_repeat', day_repeat) 
            .gte('start_time', start_time)
            .lte('end_time', end_time)
        );
      }
    }

    // 🔥 Executa todas as consultas de conflito
    const conflictResults = await Promise.all(conflictQueries);
    const existingBookings = conflictResults.flatMap(result => result.data || []);

    // 🚨 **Verifica sobreposição de horário**
    const hasConflict = existingBookings.some(booking => {
      return (start_time < booking.end_time && end_time > booking.start_time);
    });

    if (hasConflict) {
      return res.status(400).json({ error: 'Conflito de horário: já existe uma reserva nesse intervalo.' });
    }

    // ✅ **Criação da reserva**
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        description,
        room,
        date: repeat ? null : formattedDate,  // Para reservas repetidas, data será nula
        start_time: start_time,
        end_time: end_time,
        repeat,
        day_repeat: day_repeat,
        user_id: userId,
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Erro ao criar reserva:', err);
    res.status(500).json({ error: 'Erro ao criar reserva' });
  }
}

// 📌 2. Listar todas reservas
async function getBooking(req, res) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        description,
        date,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_profiles(id, name, email, phone),  
        rooms(id, name, size)  
      `);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const formattedData = data.map(booking => ({
      id: booking.id,
      description: booking.description,
      room: booking.rooms ? {
        id: booking.rooms.id,
        name: booking.rooms.name,
        size: booking.rooms.size,
      } : null,
      date: booking.date ? dayjs(booking.date).format('DD/MM/YYYY') : null,
      start_time: booking.start_time ? dayjs(booking.start_time, 'HH:mm:ss').format('HH:mm') : null,
      end_time: booking.end_time ? dayjs(booking.end_time, 'HH:mm:ss').format('HH:mm') : null,
      repeat: booking.repeat,
      day_repeat: booking.day_repeat,
      user: booking.user_profiles ? {
        id: booking.user_profiles.id,
        name: booking.user_profiles.name,
        email: booking.user_profiles.email,
        phone: booking.user_profiles.phone,
      } : null,
    }));

    res.json(formattedData);
  } catch (err) {
    console.error('Erro ao buscar reservas:', err);
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
}

// 📌 3. Pegar reserva por ID
async function getBookingById(req, res) {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        description,
        date,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_profiles(id, name, email, phone),
        rooms(id, name, size)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    // Formatação dos dados
    const formattedData = {
      id: data.id,
      description: data.description,
      room: data.rooms && {
        id: data.rooms.id,
        name: data.rooms.name,
        size: data.rooms.size,
      },
      date: data.date ? dayjs(data.date).format('DD/MM/YYYY') : null,
      start_time: data.start_time ? dayjs(data.start_time, 'HH:mm:ss').format('HH:mm') : null,
      end_time: data.end_time ? dayjs(data.end_time, 'HH:mm:ss').format('HH:mm') : null,
      repeat: data.repeat,
      day_repeat: data.day_repeat,
      user: data.user_profiles && {
        id: data.user_profiles.id,
        name: data.user_profiles.name,
        email: data.user_profiles.email,
        phone: data.user_profiles.phone,
      },
    };

    res.json(formattedData);
  } catch (err) {
    console.error('Erro ao buscar reserva:', err);
    res.status(500).json({ error: 'Erro ao buscar reserva' });
  }
}

// 📌 4. Atualizar reserva
async function updateBooking(req, res) {
  const { id } = req.params;
  const updateFields = {};

  if (req.body.description !== undefined) updateFields.description = req.body.description;
  if (req.body.room !== undefined) updateFields.room = req.body.room;
  if (req.body.date !== undefined) updateFields.date = req.body.date;
  if (req.body.star_time !== undefined) updateFields.start_time = req.body.star_time;
  if (req.body.end_time !== undefined) updateFields.end_time = req.body.end_time;
  if (req.body.repeat !== undefined) updateFields.repeat = req.body.repeat;
  if (req.body.day_repeat !== undefined) updateFields.day_repeat = req.body.day_repeat;

  try {
    // Busca os dados atuais para garantir que o ID existe
    const { data: existingData, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingData) {
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    // Garante que há algo para atualizar
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: "Nenhum campo válido enviado para atualização" });
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single(); // Retorna apenas um item atualizado

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Erro ao atualizar reserva:", err);
    res.status(500).json({ error: "Erro ao atualizar reserva" });
  }
}

// 📌 5. Deletar reserva
async function deleteBooking(req, res) {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json({ message: 'Reserva deletada com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar reserva:', err);
    res.status(500).json({ error: 'Erro ao deletar reserva' });
  }
}

// 📌 6. Buscar com filtro
async function getBookingByFilter(req, res) {
  try {
    const { userId, date, room, repeat, dayRepeat } = req.body;

    let query = supabase.from('bookings').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (date) {
      query = query.eq('date', date);
    }
    if (room) {
      query = query.eq('room', room);
    }
    if (repeat) {
      query = query.eq('repeat', repeat);
    }
    if (dayRepeat) {
      query = query.eq('day_repeat', dayRepeat);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const formattedData = data.map(booking => ({
      id: booking.id,
      description: booking.description,
      room: booking.room,
      date: booking.date ? dayjs(booking.date).format('DD/MM/YYYY') : null,
      start_time: dayjs(booking.start_time, 'HH:mm:ss').format('HH:mm'),
      end_time: dayjs(booking.end_time, 'HH:mm:ss').format('HH:mm'),
      repeat: booking.repeat,
      day_repeat: booking.day_repeat,
      user_id: booking.user_id,
    }));

    res.json(formattedData);
  } catch (err) {
    console.error('Erro ao buscar reservas:', err);
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
}

// 📌 7. Listar minhas reservas
async function getBookingMy(req, res) {
  const userId = req.profile.id;
  try {
    const { data, error } = await supabase.from('bookings').select(`id,
        description,
        date,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_profiles(id, name, email, phone),  
        rooms(id, name, size) `).eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const formattedData = data.map(booking => ({
      id: booking.id,
      description: booking.description,
      room: booking.rooms ? {
        id: booking.rooms.id,
        name: booking.rooms.name,
        size: booking.rooms.size,
      } : null,
      date: booking.date ? dayjs(booking.date).format('DD/MM/YYYY') : null,
      start_time: booking.start_time ? dayjs(booking.start_time, 'HH:mm:ss').format('HH:mm') : null,
      end_time: booking.end_time ? dayjs(booking.end_time, 'HH:mm:ss').format('HH:mm') : null,
      repeat: booking.repeat,
      day_repeat: booking.day_repeat,
      user: booking.user_profiles ? {
        id: booking.user_profiles.id,
        name: booking.user_profiles.name,
        email: booking.user_profiles.email,
        phone: booking.user_profiles.phone,
      } : null,
    }));

    res.json(formattedData);
  } catch (err) {
    console.error('Erro ao buscar reservas:', err);
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
}

// 📌 8. Listar reservas para hoje
async function getBookingsByToday(req, res) { 
  try {
    const today = dayjs().startOf('day'); 
    const { data, error } = await supabase
      .from('bookings')
      .select(`id,
        description,
        date,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_profiles(id, name, email, phone),  
        rooms(id, name, size) `)
      .or(`repeat.eq.day,date.eq.${today.format('YYYY-MM-DD')}`); 

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Formatação dos dados
    const formattedData = data.map(booking => ({
      id: booking.id,
      description: booking.description,
      room: booking.rooms ? {
        id: booking.rooms.id,
        name: booking.rooms.name,
        size: booking.rooms.size,
      } : null,
      date: booking.date ? dayjs(booking.date).format('DD/MM/YYYY') : null,
      start_time: dayjs(booking.start_time, 'HH:mm:ss').format('HH:mm'),
      end_time: dayjs(booking.end_time, 'HH:mm:ss').format('HH:mm'),
      repeat: booking.repeat,
      day_repeat: booking.day_repeat,
      user: booking.user_profiles ? {
        id: booking.user_profiles.id,
        name: booking.user_profiles.name,
        email: booking.user_profiles.email,
        phone: booking.user_profiles.phone,
      } : null,
    }));

    res.json(formattedData);
  } catch (err) {
    console.error('Erro ao buscar reservas:', err);
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
}

// 📌 9. Listar reservas para semana
async function getBookingsByWeek(req, res) {
  try {
    const startOfWeek = dayjs().startOf('week'); // Início da semana atual
    const endOfWeek = dayjs().endOf('week'); // Fim da semana atual

    const { data, error } = await supabase
      .from('bookings')
      .select(`id,
        description,
        date,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_profiles(id, name, email, phone),  
        rooms(id, name, size)`)
        .or(`repeat.eq.week,date.gte.${startOfWeek.format('YYYY-MM-DD')},date.lte.${endOfWeek.format('YYYY-MM-DD')}`); // Filtra tanto as repetições semanais quanto as datas dentro da semana atual

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Formatação dos dados
    const formattedData = data.map(booking => ({
      id: booking.id,
      description: booking.description,
      room: booking.rooms ? {
        id: booking.rooms.id,
        name: booking.rooms.name,
        size: booking.rooms.size,
      } : null,
      date: booking.date ? dayjs(booking.date).format('DD/MM/YYYY') : null,
      start_time: dayjs(booking.start_time, 'HH:mm:ss').format('HH:mm'),
      end_time: dayjs(booking.end_time, 'HH:mm:ss').format('HH:mm'),
      repeat: booking.repeat,
      day_repeat: booking.day_repeat,
      user: booking.user_profiles ? {
        id: booking.user_profiles.id,
        name: booking.user_profiles.name,
        email: booking.user_profiles.email,
        phone: booking.user_profiles.phone,
      } : null,
    }));

    res.json(formattedData);
  } catch (err) {
    console.error('Erro ao buscar reservas:', err);
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
}

// 📌 10. Listar reservas para o mes
async function getBookingsByMonth(req, res) {
  try {
    const startOfMonth = dayjs().startOf('month'); // Início do mês atual
    const endOfMonth = dayjs().endOf('month'); // Fim do mês atual

    const { data, error } = await supabase
      .from('bookings')
      .select(`id,
        description,
        date,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_profiles(id, name, email, phone),  
        rooms(id, name, size)`)
      .or(`repeat.eq.month,date.gte.${startOfMonth.format('YYYY-MM-DD')},date.lte.${endOfMonth.format('YYYY-MM-DD')}`); // Filtra tanto as repetições semanais quanto as datas dentro do mês atual

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Formatação dos dados
    const formattedData = data.map(booking => ({
      id: booking.id,
      description: booking.description,
      room: booking.rooms ? {
        id: booking.rooms.id,
        name: booking.rooms.name,
        size: booking.rooms.size,
      } : null,
      date: booking.date ? dayjs(booking.date).format('DD/MM/YYYY') : null,
      start_time: dayjs(booking.start_time, 'HH:mm:ss').format('HH:mm'),
      end_time: dayjs(booking.end_time, 'HH:mm:ss').format('HH:mm'),
      repeat: booking.repeat,
      day_repeat: booking.day_repeat,
      user: booking.user_profiles ? {
        id: booking.user_profiles.id,
        name: booking.user_profiles.name,
        email: booking.user_profiles.email,
        phone: booking.user_profiles.phone,
      } : null,
    }));

    res.json(formattedData);
  } catch (err) {
    console.error('Erro ao buscar reservas:', err);
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
}

// 📌 0. Rotas com Middleware
router.route("/").post(middleware.requireAuth, createBooking);
router.route("/").get(middleware.publicRoute, getBooking);
router.route("/my").get(middleware.requireAuth, getBookingMy);
router.route("/filter").post(middleware.requireAuth, getBookingByFilter);
router.route("/today").get(middleware.publicRoute, getBookingsByToday);
router.route("/week").get(middleware.publicRoute, getBookingsByWeek);
router.route("/month").get(middleware.publicRoute, getBookingsByMonth);

router.route("/:id").put(middleware.requireAdmin, updateBooking); 
router.route("/:id").get(middleware.publicRoute, getBookingById); 
router.route("/:id").delete(middleware.requireAuth, middleware.requireAdmin, deleteBooking);


export default router;
