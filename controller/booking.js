import express from "express";
import dayjs from "dayjs";
import "dayjs/locale/pt.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import supabase from "../config/supabaseClient.js";
import middleware from "./middleware.js";

const router = express.Router();
dayjs.extend(customParseFormat);
dayjs.locale('pt'); 


// 📌 1. Criar uma nova reserva
// 📌 1. Criar uma nova reserva
async function createBooking(req, res) {
  const userId = req.profile.id;
  const { description, room, date, start_time, end_time, repeat, day_repeat } = req.body;

  if (!description || !room || !start_time || !end_time) {
    return res.status(400).json({ error: 'Campos obrigatórios não foram enviados.' });
  }

  if (!repeat && !date) {
    return res.status(400).json({ error: 'Data é obrigatória, a menos que a reserva seja repetida.' });
  }

  if (start_time >= end_time) {
    return res.status(400).json({ error: 'Os horários são inválidos.' });
  }

  const formattedDate = date ? dayjs(date, 'DD/MM/YYYY').format('YYYY-MM-DD') : null;

  try {
    // 🔍 Buscar reservas com possível conflito
    const conflictFilters = repeat
      ? { room, repeat, day_repeat }
      : { room, date: formattedDate };

    const { data: existing, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .match(conflictFilters);

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    // 🚨 Validação real de sobreposição de horário
    const hasConflict = existing.some(booking => {
      const bookingStart = dayjs(booking.start_time, 'HH:mm:ss');
      const bookingEnd = dayjs(booking.end_time, 'HH:mm:ss');
      const newStart = dayjs(start_time, 'HH:mm');
      const newEnd = dayjs(end_time, 'HH:mm');

      return newStart.isBefore(bookingEnd) && newEnd.isAfter(bookingStart);
    });

    if (hasConflict) {
      return res.status(400).json({ error: 'Já existe uma reserva nesse horário para a sala selecionada.' });
    }

    // ✅ Criar reserva
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        description,
        room,
        date: repeat ? null : formattedDate,
        start_time,
        end_time,
        repeat,
        day_repeat,
        user_id: userId
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

    // Mapeamento dos dias da semana abreviados
    const weekDaysAbbr = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Formatação dos dados
    const formattedData = data.map(booking => {
      const dayweek = booking.date ? parseInt(dayjs(booking.date).locale('pt').format('d')) : null; // Obter o número do dia da semana (0-6) e garantir que seja um inteiro
      const repeatDay = booking.day_repeat ? weekDaysAbbr[booking.day_repeat] : null; // Dia da semana para repeat abreviado
      const dayOfWeek = dayweek !== null ? weekDaysAbbr[dayweek] : null; // Dia da semana abreviado
      const monthName = booking.date ? dayjs(booking.date).locale('pt').format('MMM') : null; // Nome do mês abreviado (Jan, Fev, Mar, etc.)

      return {
        id: booking.id,
        description: booking.description,
        room: booking.rooms ? {
          id: booking.rooms.id,
          name: booking.rooms.name,
          size: booking.rooms.size,
        } : null,
        date: booking.date ? dayjs(booking.date).format('DD/MM/YYYY') : null,
        day_of_week: dayOfWeek == null ? repeatDay : dayOfWeek, // Garantir que day_of_week seja retornado corretamente
        month: monthName, // Nome do mês abreviado
        start_time: booking.start_time ? dayjs(booking.start_time, 'HH:mm:ss').format('HH:mm') : null,
        end_time: booking.end_time ? dayjs(booking.end_time, 'HH:mm:ss').format('HH:mm') : null,
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
      .single(); 

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.log(err)
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

    // Mapeamento dos dias da semana abreviados
    const weekDaysAbbr = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Formatação dos dados
    const formattedData = data.map(booking => {
      const dayweek = booking.date ? parseInt(dayjs(booking.date).locale('pt').format('d')) : null; // Obter o número do dia da semana (0-6) e garantir que seja um inteiro
      const repeatDay = booking.day_repeat ? weekDaysAbbr[booking.day_repeat] : null; // Dia da semana para repeat abreviado
      const dayOfWeek = dayweek !== null ? weekDaysAbbr[dayweek] : null; // Dia da semana abreviado
      const monthName = booking.date ? dayjs(booking.date).locale('pt').format('MMM') : null; // Nome do mês abreviado (Jan, Fev, Mar, etc.)

      return {
        id: booking.id,
        description: booking.description,
        room: booking.rooms ? {
          id: booking.rooms.id,
          name: booking.rooms.name,
          size: booking.rooms.size,
        } : null,
        date: booking.date ? dayjs(booking.date).format('DD/MM/YYYY') : null,
        day_of_week: dayOfWeek == null ? repeatDay : dayOfWeek, // Garantir que day_of_week seja retornado corretamente
        month: monthName, // Nome do mês abreviado
        start_time: booking.start_time ? dayjs(booking.start_time, 'HH:mm:ss').format('HH:mm') : null,
        end_time: booking.end_time ? dayjs(booking.end_time, 'HH:mm:ss').format('HH:mm') : null,
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

    // Mapeamento dos dias da semana abreviados
    const weekDaysAbbr = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Formatação dos dados
    const formattedData = data.map(booking => {
      const dayweek = booking.date ? parseInt(dayjs(booking.date).locale('pt').format('d')) : null; // Obter o número do dia da semana (0-6) e garantir que seja um inteiro
      const repeatDay = booking.day_repeat ? weekDaysAbbr[booking.day_repeat] : null; // Dia da semana para repeat abreviado
      const dayOfWeek = dayweek !== null ? weekDaysAbbr[dayweek] : null; // Dia da semana abreviado
      const monthName = booking.date ? dayjs(booking.date).locale('pt').format('MMM') : null; // Nome do mês abreviado (Jan, Fev, Mar, etc.)

      return {
        id: booking.id,
        description: booking.description,
        room: booking.rooms ? {
          id: booking.rooms.id,
          name: booking.rooms.name,
          size: booking.rooms.size,
        } : null,
        date: booking.date ? dayjs(booking.date).format('DD/MM/YYYY') : null,
        day_of_week: dayOfWeek == null ? repeatDay : dayOfWeek, // Garantir que day_of_week seja retornado corretamente
        month: monthName, // Nome do mês abreviado
        start_time: dayjs(booking.start_time, 'HH:mm:ss').format('HH:mm'),
        end_time: dayjs(booking.end_time, 'HH:mm:ss').format('HH:mm'),
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
    console.error('Erro ao buscar reservas:', err);
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
}


// 📌 10. Listar reservas para o mês
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
      .or(`repeat.eq.month,date.gte.${startOfMonth.format('YYYY-MM-DD')},date.lte.${endOfMonth.format('YYYY-MM-DD')}`); // Filtra tanto as repetições mensais quanto as datas dentro do mês atual

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Mapeamento dos dias da semana abreviados
    const weekDaysAbbr = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Formatação dos dados
    const formattedData = data.map(booking => {
      const dayweek = booking.date ? dayjs(booking.date).locale('pt').format('d') : null; // Obter o número do dia da semana (0-6)
      const repeatDay = booking.day_repeat ? weekDaysAbbr[booking.day_repeat] : null; // Dia da semana para repeat abreviado
      const dayOfWeek = weekDaysAbbr[dayweek]; // Dia da semana abreviado
      const monthName = booking.date ? dayjs(booking.date).locale('pt').format('MMM') : null; // Nome do mês abreviado (Jan, Fev, Mar, etc.)

      return {
        id: booking.id,
        description: booking.description,
        room: booking.rooms ? {
          id: booking.rooms.id,
          name: booking.rooms.name,
          size: booking.rooms.size,
        } : null,
        date: booking.date ? dayjs(booking.date).format('DD/MM/YYYY') : null,
        day_of_week: dayOfWeek, // Dia da semana abreviado em pt-BR
        month: monthName, // Nome do mês abreviado
        start_time: dayjs(booking.start_time, 'HH:mm:ss').format('HH:mm'),
        end_time: dayjs(booking.end_time, 'HH:mm:ss').format('HH:mm'),
        repeat: booking.repeat,
        repeat_day: repeatDay, // Dia da repetição abreviado
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
    console.error('Erro ao buscar reservas:', err);
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
}

// 📌 11. Listar reservas para o calendario
async function getBookingsOfCalendar(req, res) {
   try {
    // Lê os parâmetros de mês e ano da query string
    const { month, year } = req.query;

    // Caso o mês ou o ano não sejam enviados, usamos o mês e ano atuais
    const currentMonth = month ? parseInt(month, 10) : dayjs().month() + 1;
    const currentYear = year ? parseInt(year, 10) : dayjs().year();


    // Determina o intervalo do mês (início e fim do mês)
    const startOfMonth = dayjs().year(currentYear).month(currentMonth - 1).startOf('month');
    const endOfMonth = dayjs().year(currentYear).month(currentMonth - 1).endOf('month');

    // Consulta as reservas no banco de dados para o mês
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
      .gte('date', startOfMonth.format('YYYY-MM-DD')) // Filtra eventos após ou no início do mês
      .lte('date', endOfMonth.format('YYYY-MM-DD')); // Filtra eventos antes ou no final do mês

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Mapeamento dos dias da semana abreviados
    const weekDaysAbbr = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Formatação dos dados de eventos
    const formattedData = [];

    data.forEach(booking => {
      // Certificando-se de que a data está no formato correto
      const formattedDate = dayjs(booking.date); // O dayjs já pode processar datas no formato "YYYY-MM-DD"
      
      // Verifica se a data é válida
      if (!formattedDate.isValid() && booking.repeat !== 'week') {
        console.error('Data inválida:', booking.date);
        return; // Pula o evento se a data for inválida e não for repetido semanalmente
      }

      const dayweek = formattedDate.isValid() ? formattedDate.locale('pt').format('d') : null; // Obter o número do dia da semana (0-6) se a data for válida
      const repeatDay = booking.day_repeat ? weekDaysAbbr.indexOf(booking.day_repeat) : null; // Converte o nome do dia (ex: 'Seg') em um índice (0-6)
      const dayOfWeek = weekDaysAbbr[dayweek]; // Dia da semana abreviado
      const monthName = formattedDate.isValid() ? formattedDate.locale('pt').format('MMM') : null; // Nome do mês abreviado (Jan, Fev, Mar, etc.)

      // Adicionando o evento principal
      formattedData.push({
        id: booking.id,
        description: booking.description,
        room: booking.rooms ? {
          id: booking.rooms.id,
          name: booking.rooms.name,
          size: booking.rooms.size,
        } : null,
        date: formattedDate.isValid() ? formattedDate.format('YYYY-MM-DD') : null,
        day_of_week: dayOfWeek, // Dia da semana abreviado em pt-BR
        month: monthName, // Nome do mês abreviado
        start_time: dayjs(booking.start_time, 'HH:mm:ss').format('HH:mm'),
        end_time: dayjs(booking.end_time, 'HH:mm:ss').format('HH:mm'),
        repeat: booking.repeat,
        repeat_day: booking.day_repeat, // Dia da repetição abreviado
        user: booking.user_profiles ? {
          id: booking.user_profiles.id,
          name: booking.user_profiles.name,
          email: booking.user_profiles.email,
          phone: booking.user_profiles.phone,
        } : null,
      });

      // Lógica para eventos repetidos semanalmente
      if (booking.repeat === 'week' && repeatDay !== null) {
        let currentDay = startOfMonth;

        // Encontrar o primeiro dia correspondente à repetição no mês
        while (currentDay.day() !== repeatDay) {
          currentDay = currentDay.add(1, 'day'); // Avança até o próximo dia que coincide com repeat_day
        }

        // Agora, atualiza a data com todas as ocorrências daquela semana para o mês atual
        while (currentDay.isBefore(endOfMonth, 'day')) {
          formattedData.push({
            id: booking.id,
            description: booking.description,
            room: booking.rooms ? {
              id: booking.rooms.id,
              name: booking.rooms.name,
              size: booking.rooms.size,
            } : null,
            date: currentDay.format('DD/MM/YYYY'),
            day_of_week: weekDaysAbbr[currentDay.day()], // Dia da semana abreviado
            month: currentDay.format('MMM'), // Nome do mês abreviado
            start_time: dayjs(booking.start_time, 'HH:mm:ss').format('HH:mm'),
            end_time: dayjs(booking.end_time, 'HH:mm:ss').format('HH:mm'),
            repeat: booking.repeat,
            repeat_day: booking.day_repeat, // Dia da repetição abreviado
            user: booking.user_profiles ? {
              id: booking.user_profiles.id,
              name: booking.user_profiles.name,
              email: booking.user_profiles.email,
              phone: booking.user_profiles.phone,
            } : null,
          });

          // Avança para a próxima semana
          currentDay = currentDay.add(1, 'week');
        }
      }
    });

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
router.route("/calendar").get(middleware.publicRoute, getBookingsOfCalendar);

router.route("/:id").put(middleware.requireAdmin, updateBooking);
router.route("/:id").get(middleware.publicRoute, getBookingById);
router.route("/:id").delete(middleware.requireAuth, middleware.requireAdmin, deleteBooking);


export default router;
