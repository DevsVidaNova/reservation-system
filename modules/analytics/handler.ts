import supabase from "@/config/supabaseClient";
import dayjs from "dayjs";

export interface AnalyticsCounts {
  rooms: number;
  bookings: number;
  users: number;
  week: number;
  members: number;
}

export interface HandlerResult<T> {
  data?: T;
  error?: string;
}

export async function getCountHandler(tableName: string): Promise<HandlerResult<number>> {
  try {
    // Validar se o nome da tabela é válido
    if (!tableName || typeof tableName !== 'string' || tableName.trim() === '') {
      return { error: 'Nome da tabela é obrigatório e deve ser uma string válida.' };
    }

    // Lista de tabelas permitidas para segurança
    const allowedTables = ['rooms', 'bookings', 'user_profiles', 'members'];
    if (!allowedTables.includes(tableName)) {
      return { error: `Tabela '${tableName}' não é permitida para consulta.` };
    }

    const { count, error } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });
    if (error) return { error: error.message };
    return { data: count || 0 };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getStatsHandler(): Promise<HandlerResult<AnalyticsCounts>> {
  try {
    const [rooms, bookings, users, members] = await Promise.all([
      getCountHandler("rooms"),
      getCountHandler("bookings"),
      getCountHandler("user_profiles"),
      getCountHandler("members")
    ]);

    if (rooms.error || bookings.error || users.error || members.error) {
      return {
        error: JSON.stringify({
          roomsError: rooms.error,
          bookingsError: bookings.error,
          usersError: users.error,
          membersError: members.error
        })
      };
    }

    const lastWeekISO = dayjs().subtract(7, "days").format("YYYY-MM-DD");
    const { count: week, error: weekError } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("date", lastWeekISO);
    if (weekError) {
      return { error: weekError.message };
    }

    return {
      data: {
        rooms: rooms.data || 0,
        bookings: bookings.data || 0,
        users: users.data || 0,
        week: week || 0,
        members: members.data || 0
      }
    };
  } catch (error: any) {
    return { error: error.message };
  }
}