const supabase = require('../config/supabaseClient');
const express = require("express");
const middleware = require('./middleware')
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');

const router = express.Router();
dayjs.extend(customParseFormat);

async function createBooking(req, res) {
  const userId = req.user.id;
  const { description, room, date, startTime, endTime, repeat, dayRepeat } = req.body;

  if (!repeat && !date) {
    return res.status(400).json({ error: 'Data é obrigatória, a menos que a reserva seja repetida.' });
  }

  try {
    let conflictQueries = [];

    // 🔍 Se for uma reserva normal, verifica se há conflitos no mesmo dia
    if (date) {
      conflictQueries.push(
        supabase.from('bookings').select('*')
          .eq('room', room)
          .eq('date', date)
      );

      // 🔍 Também verifica se há uma reserva repetitiva no mesmo dia da semana
      const dayOfWeek = dayjs(date).format('dddd'); // Ex: "Monday"
      conflictQueries.push(
        supabase.from('bookings').select('*')
          .eq('room', room)
          .eq('day_repeat', dayOfWeek)
          .neq('date', null) // Para garantir que é uma reserva recorrente
      );
    }

    // 🔍 Se for uma reserva recorrente, verifica conflitos no mesmo `day_repeat`
    if (repeat) {
      conflictQueries.push(
        supabase.from('bookings').select('*')
          .eq('room', room)
          .eq('day_repeat', dayRepeat)
      );

      // 🔍 Também verifica se há uma reserva normal (`date`) que cai nesse `day_repeat`
      conflictQueries.push(
        supabase.from('bookings').select('*')
          .eq('room', room)
          .eq('date', dayjs().day(dayRepeat).format('YYYY-MM-DD'))
      );
    }

    // 🔥 Executa todas as consultas de conflito
    const conflictResults = await Promise.all(conflictQueries);
    const existingBookings = conflictResults.flatMap(result => result.data || []);

    // 🚨 **Verifica sobreposição de horário**
    const hasConflict = existingBookings.some(booking => {
      return startTime < booking.end_time && endTime > booking.start_time;
    });

    if (hasConflict) {
      return res.status(400).json({ error: 'Conflito de horário: já existe uma reserva nesse intervalo.' });
    }

    // ✅ **Criação da reserva**
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          description,
          room,
          date: repeat ? null : date,
          start_time: startTime,
          end_time: endTime,
          repeat,
          day_repeat: dayRepeat,
          user_id: userId,
        },
      ])
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

async function getBooking(req, res) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*');

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

async function getBookingById(req, res) {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    res.json(data);
  } catch (err) {
    console.error('Erro ao buscar reserva:', err);
    res.status(500).json({ error: 'Erro ao buscar reserva' });
  }

}

async function updateBooking(req, res) {
  const { id } = req.params;
  const updateFields = {};

  if (req.body.description !== undefined) updateFields.description = req.body.description;
  if (req.body.room !== undefined) updateFields.room = req.body.room;
  if (req.body.date !== undefined) updateFields.date = req.body.date;
  if (req.body.startTime !== undefined) updateFields.start_time = req.body.startTime;
  if (req.body.endTime !== undefined) updateFields.end_time = req.body.endTime;
  if (req.body.repeat !== undefined) updateFields.repeat = req.body.repeat;
  if (req.body.dayRepeat !== undefined) updateFields.day_repeat = req.body.dayRepeat;

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

router.route("/").post(middleware.requireAuth, createBooking);
router.route("/").get(middleware.publicRoute, getBooking); // Precisa apenas de autenticação
router.route("/filter").post(middleware.requireAuth, getBookingByFilter); 

router.route("/:id").put(middleware.requireAdmin, updateBooking); // Precisa apenas de autenticação
router.route("/:id").get(middleware.publicRoute, getBookingById); // Precisa apenas de autenticação
router.route("/:id").delete(middleware.requireAuth, middleware.requireAdmin, deleteBooking); // Precisa de autenticação e admin

module.exports = router;
