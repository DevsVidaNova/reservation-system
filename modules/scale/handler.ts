// Funções puras de acesso ao banco de dados para escala
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import supabase from "../../config/supabaseClient.js";
dayjs.extend(customParseFormat);

export interface ScaleInput {
  date: string;
  band?: string;
  name: string;
  projection?: string;
  light?: string;
  transmission?: string;
  camera?: string;
  live?: string;
  sound?: string;
  training_sound?: string;
  photography?: string;
  stories?: string;
  dynamic?: string;
  direction: string;
}

export interface Scale {
  id: string;
  date: string;
  name: string;
  description?: string;
  direction?: any;
  band?: any;
  projection?: string;
  light?: string;
  transmission?: string;
  camera?: string;
  live?: string;
  sound?: string;
  training_sound?: string;
  photography?: string;
  stories?: string;
  dynamic?: string;
}

export interface HandlerResult<T> {
  data?: T;
  error?: string;
}

export async function createScaleHandler(input: ScaleInput): Promise<HandlerResult<null>> {
  try {
    const formattedDate = dayjs(input.date, 'DD/MM/YYYY').format('YYYY-MM-DD');
    if (!dayjs(formattedDate).isValid()) {
      return { error: "Data inválida." };
    }

    // Verificar se já existe uma escala com o mesmo nome
    const { data: existingScale } = await supabase
      .from("scales")
      .select("id")
      .eq("name", input.name)
      .single();

    if (existingScale) {
      return { error: "Já existe uma escala com este nome." };
    }

    const { error } = await supabase
      .from("scales")
      .insert([{ ...input, date: formattedDate }]);
    if (error) {
      return { error: error.message };
    }
    return { data: null };
  } catch (err) {
    return { error: "Erro ao criar escala." };
  }
}

export interface GetScalesParams {
  page?: number;
  pageSize?: number;
}

export interface GetScalesResult {
  scales: Scale[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export async function getScalesHandler(params: GetScalesParams): Promise<HandlerResult<GetScalesResult>> {
  try {
    const page = params.page || 1;
    const pageSize = params.pageSize || 15;
    const offset = (page - 1) * pageSize;
    const { data, error, count } = await supabase
      .from("scales")
      .select(`id, date, name, description, direction:direction(id, full_name), band:band(id, full_name)`, { count: "exact" })
      .range(offset, offset + pageSize - 1);
    if (error) {
      return { error: error.message };
    }
    return {
      data: {
        scales: data as Scale[],
        pagination: {
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      },
    };
  } catch (err) {
    return { error: "Erro ao listar escalas." };
  }
}

export async function getScaleByIdHandler(id: string): Promise<HandlerResult<Scale>> {
  try {
    const { data, error } = await supabase
      .from("scales")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      return { error: "Escala não encontrada." };
    }
    return { data: data as Scale };
  } catch (err) {
    return { error: "Erro ao buscar escala." };
  }
}

export async function updateScaleHandler(id: string, updates: Partial<ScaleInput>): Promise<HandlerResult<null>> {
  try {
    // Verificar se a escala existe
    const { data: existingScale } = await supabase
      .from("scales")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingScale) {
      return { error: "Escala não encontrada." };
    }

    // Se está atualizando o nome, verificar se não há duplicata
    if (updates.name) {
      const { data: duplicateScale } = await supabase
        .from("scales")
        .select("id")
        .eq("name", updates.name)
        .neq("id", id)
        .single();

      if (duplicateScale) {
        return { error: "Já existe uma escala com este nome." };
      }
    }

    const { error } = await supabase.from("scales").update(updates).eq("id", id);
    if (error) return { error: error.message };
    return { data: null };
  } catch (err) {
    return { error: "Erro ao atualizar escala." };
  }
}

export async function deleteScaleHandler(id: string): Promise<HandlerResult<null>> {
  try {
    // Verificar se a escala existe antes de tentar deletar
    const { data: existingScale } = await supabase
      .from("scales")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingScale) {
      return { error: "Escala não encontrada." };
    }

    const { error } = await supabase.from("scales").delete().eq("id", id);
    if (error) return { error: "Erro ao excluir escala." };
    return { data: null };
  } catch (err) {
    return { error: "Erro ao excluir escala." };
  }
}

export async function searchScaleHandler(name: string): Promise<HandlerResult<Scale[]>> {
  try {
    if (!name || name.trim() === "") {
      return { error: "Nome para busca não pode estar vazio." };
    }

    const { data, error } = await supabase.from("scales").select("*").ilike("name", `%${name}%`);
    if (error) return { error: "Erro ao buscar escala." };
    return { data: data as Scale[] };
  } catch (err) {
    return { error: "Erro ao buscar escala." };
  }
}

export async function duplicateScaleHandler(id: string): Promise<HandlerResult<Scale>> {
  try {
    const { data: originalScale, error } = await supabase.from("scales").select("*").eq("id", id).single();
    if (error || !originalScale) return { error: "Escala não encontrada." };
    delete originalScale.id;
    originalScale.name += " (duplicado)";
    const { data: duplicatedScale, error: insertError } = await supabase.from("scales").insert([originalScale]).select().single();
    if (insertError) return { error: "Erro ao duplicar escala." };
    return { data: duplicatedScale as Scale };
  } catch (err) {
    return { error: "Erro ao duplicar escala." };
  }
}
