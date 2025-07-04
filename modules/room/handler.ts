import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import supabase from "@/config/supabaseClient";
dayjs.extend(customParseFormat);

// Tipos auxiliares
export interface RoomInput {
  name: string;
  size?: number;
  description?: string;
  exclusive?: boolean;
  status?: string;
}

export interface UpdateRoomInput {
  id: string;
  updates: Partial<RoomInput>;
}

export async function createRoomHandler(data: RoomInput) {
  if (!data.name) {
    return { error: "O nome da sala é obrigatório.", data: null };
  }
  
  // Verificar se já existe uma sala com o mesmo nome
  const { data: existingRoom } = await supabase
    .from("rooms")
    .select("id")
    .eq("name", data.name)
    .single();
    
  if (existingRoom) {
    return { error: "Já existe uma sala com este nome.", data: null };
  }
  
  const { data: room, error } = await supabase
    .from("rooms")
    .insert([{ ...data }])
    .select()
    .single();
  return { data: room, error: error?.message || null };
}

export async function getRoomsHandler(page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, count, error } = await supabase
    .from("rooms")
    .select("*", { count: "exact" })
    .range(from, to);
  const totalPages = Math.ceil((count || 0) / limit);
  return {
    data,
    total: count,
    page,
    to: data ? data.length : 0,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    error: error?.message || null
  };
}

export async function getRoomByIdHandler(id: string) {
  const { data, error } = await supabase.from("rooms").select("*").eq("id", id).single();
  return {
    data,
    error: error ? (error.message || "Sala não encontrada.") : null
  };
}

export async function updateRoomHandler({ id, updates }: UpdateRoomInput) {
  // Se está atualizando o nome, verificar se não existe outra sala com o mesmo nome
  if (updates.name) {
    const { data: roomWithSameName } = await supabase
      .from("rooms")
      .select("id")
      .eq("name", updates.name)
      .neq("id", id)
      .single();
      
    if (roomWithSameName) {
      return { error: "Já existe uma sala com este nome.", data: null };
    }
  }
  
  const { data, error } = await supabase
    .from("rooms")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
    
  if (!data) {
    return { error: "Sala não encontrada.", data: null };
  }
    
  return {
    data,
    error: error?.message || null
  };
}

export async function deleteRoomHandler(id: string) {
  const { data, error } = await supabase.from("rooms").delete().eq("id", id);
  return {
    data,
    error: error?.message || null
  };
}

export async function searchRoomHandler(name: string) {
  if (!name || name.trim() === '') {
    return { error: "Nome é obrigatório para busca.", data: null };
  }
  
  const { data, error } = await supabase.from("rooms").select("*").ilike("name", `%${name}%`);
  return {
    data,
    error: error ? (error.message || "Sala não encontrada.") : null
  };
}
