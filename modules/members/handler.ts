import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import supabase from "@/config/supabaseClient";
import translateError from "@/utils/errors";
dayjs.extend(customParseFormat);

export interface MemberData {
  full_name: string;
  birth_date: string;
  gender: string;
  cpf?: string;
  rg?: string;
  phone: string;
  email: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  mother_name?: string;
  father_name?: string;
  marital_status?: string;
  has_children?: boolean;
  children_count?: number;
}

export interface Member {
  id: number;
  full_name: string;
  birth_date: string;
  gender: string;
  cpf?: string;
  rg?: string;
  phone: string;
  email: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  mother_name?: string;
  father_name?: string;
  marital_status?: string;
  has_children?: boolean;
  children_count?: number;
}

export interface HandlerResult<T = any> {
  data?: T;
  error?: string;
}

export async function createMemberHandler(memberData: MemberData): Promise<HandlerResult<Member>> {
  const { full_name, birth_date, gender, cpf, rg, phone, email, street, number, neighborhood, city, state, cep, mother_name, father_name, marital_status, has_children, children_count } = memberData;
  if (!full_name || !birth_date || !gender || !phone || !email) {
    return { error: "Campos obrigatórios ausentes." };
  }
  const formattedBirthDate = dayjs(birth_date, "DD/MM/YYYY").format("YYYY-MM-DD");
  try {
    const { data, error } = await supabase
      .from("members")
      .insert([{ full_name, birth_date: formattedBirthDate, gender, cpf, rg, phone, email, street, number, neighborhood, city, state, cep, mother_name, father_name, marital_status, has_children, children_count }])
      .select()
      .single();
    if (error) throw error;
    return { data };
  } catch (err) {
    return { error: translateError(err) };
  }
}

export interface GetMembersParams {
  page?: number;
  limit?: number;
}

export interface GetMembersResult {
  data: Member[];
  total: number;
  page: number;
  to: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export async function getMembersHandler({ page = 1, limit = 10 }: GetMembersParams): Promise<HandlerResult<GetMembersResult>> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from("members")
      .select("*", { count: "exact" })
      .range(from, to);
    if (error) return { error: error.message };
    const formattedData = (data as Member[]).map(member => ({
      ...member,
      birth_date: dayjs(member.birth_date).format("DD/MM/YYYY")
    }));
    const totalPages = Math.ceil((count || 0) / limit);
    return {
      data: {
        data: formattedData,
        total: count || 0,
        page,
        to: data ? data.length : 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (err) {
    return { error: "Erro ao buscar membros." };
  }
}

export async function getMemberByIdHandler(id: number | string): Promise<HandlerResult<Member>> {
  try {
    const { data, error } = await supabase.from("members").select("*").eq("id", id).single();
    if (error) return { error: "Membro não encontrado." };
    
    // Formatar data de nascimento para exibição
    const formattedData = {
      ...data,
      birth_date: dayjs(data.birth_date).format("DD/MM/YYYY")
    };
    
    return { data: formattedData };
  } catch (err) {
    return { error: "Erro ao buscar membro." };
  }
}

export async function updateMemberHandler(id: number | string, updates: Partial<MemberData>): Promise<HandlerResult<Member>> {
  if (updates.birth_date) {
    const formattedBirthDate = dayjs(updates.birth_date, "DD/MM/YYYY").format("YYYY-MM-DD");
    updates.birth_date = formattedBirthDate;
  }
  try {
    const { data, error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) return { error: error.message };
    return { data };
  } catch (err) {
    return { error: "Erro ao atualizar membro." };
  }
}

export async function deleteMemberHandler(id: number | string): Promise<HandlerResult<{ message: string }>> {
  try {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) return { error: error.message };
    return { data: { message: "Membro deletado com sucesso." } };
  } catch (err) {
    return { error: "Erro ao deletar membro." };
  }
}

export async function searchMemberHandler(full_name: string): Promise<HandlerResult<Member[]>> {
  if (!full_name || full_name.trim() === "") {
    return { error: "Nome é obrigatório para busca." };
  }
  
  try {
    const { data, error } = await supabase.from("members").select("*").ilike("full_name", `%${full_name}%`);
    if (error) return { error: "Membro não encontrado." };
    
    // Formatar datas de nascimento para exibição
    const formattedData = (data as Member[]).map(member => ({
      ...member,
      birth_date: dayjs(member.birth_date).format("DD/MM/YYYY")
    }));
    
    return { data: formattedData };
  } catch (err) {
    return { error: "Erro ao buscar membro." };
  }
}

export interface SearchByFilterParams {
  field: string;
  value: any;
  operator: string;
}

export async function searchByFilterHandler({ field, value, operator }: SearchByFilterParams): Promise<HandlerResult<Member[]>> {
  if (!field || value === undefined || !operator) {
    return { error: "Parâmetros inválidos." };
  }
  
  // Validar campos permitidos para busca
  const allowedFields = ['full_name', 'gender', 'phone', 'email', 'city', 'state', 'marital_status', 'has_children'];
  if (!allowedFields.includes(field)) {
    return { error: "Campo não permitido para busca." };
  }
  
  try {
    let query = supabase.from("members").select("*");
    switch (operator) {
      case "eq": query = query.eq(field, value); break;
      case "neq": query = query.neq(field, value); break;
      case "gt": query = query.gt(field, value); break;
      case "gte": query = query.gte(field, value); break;
      case "lt": query = query.lt(field, value); break;
      case "lte": query = query.lte(field, value); break;
      case "like": query = query.like(field, value); break;
      case "ilike": query = query.ilike(field, value); break;
      default: return { error: "Operador inválido." };
    }
    const { data, error } = await query;
    if (error) return { error: "Nenhum resultado encontrado." };
    
    // Formatar datas de nascimento para exibição
    const formattedData = (data as Member[]).map(member => ({
      ...member,
      birth_date: dayjs(member.birth_date).format("DD/MM/YYYY")
    }));
    
    return { data: formattedData };
  } catch (err) {
    return { error: "Erro ao buscar com filtro." };
  }
}

export async function getAnalyticsHandler(): Promise<HandlerResult<any>> {
  try {
    const { data: members, error } = await supabase.from("members").select("*");
    if (error) return { error: "Erro ao buscar membros." };
    
    const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];
    const totalMembers = members.length;
    
    // Estatísticas por Estado Civil
    const maritalStatusCount = members.reduce((acc: any, member: Member) => {
      const status = member.marital_status || 'Não informado';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const maritalStatusChart = Object.keys(maritalStatusCount).map((status, index) => ({
      label: status,
      value: maritalStatusCount[status],
      percentage: ((maritalStatusCount[status] / totalMembers) * 100).toFixed(2),
      fill: colors[index % colors.length],
    }));
    
    // Estatísticas por Gênero
    const genderCount = members.reduce((acc: any, member: Member) => {
      acc[member.gender] = (acc[member.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const genderChart = Object.keys(genderCount).map((gender, index) => ({
      label: gender,
      value: genderCount[gender],
      percentage: ((genderCount[gender] / totalMembers) * 100).toFixed(2),
      fill: colors[index % colors.length],
    }));
    
    // Estatísticas por Quantidade de Filhos
    const childrenCount = members.reduce((acc: any, member: Member) => {
      const count = member.children_count || 0;
      acc[count] = (acc[count] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const childrenChart = Object.keys(childrenCount).map((count, index) => ({
      label: `${count} filhos`,
      value: childrenCount[parseInt(count)],
      percentage: ((childrenCount[parseInt(count)] / totalMembers) * 100).toFixed(2),
      fill: colors[index % colors.length],
    }));
    
    // Estatísticas por Faixa Etária
    const calculateAge = (birthDate: string): number => {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const month = today.getMonth();
      if (month < birth.getMonth() || (month === birth.getMonth() && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };
    
    const ageRanges: Record<string, number> = {
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46-55": 0,
      "56+": 0,
    };
    
    members.forEach((member: Member) => {
      const age = calculateAge(member.birth_date);
      if (age >= 18 && age <= 25) ageRanges["18-25"]++;
      else if (age >= 26 && age <= 35) ageRanges["26-35"]++;
      else if (age >= 36 && age <= 45) ageRanges["36-45"]++;
      else if (age >= 46 && age <= 55) ageRanges["46-55"]++;
      else if (age >= 56) ageRanges["56+"]++;
    });
    
    const ageStatistics = Object.keys(ageRanges).map((range) => ({
      label: range,
      value: ageRanges[range],
      percentage: ((ageRanges[range] / totalMembers) * 100).toFixed(2),
      fill: getRandomColor(),
    }));
    
    // Estatísticas por Região
    const cityCount: Record<string, number> = {};
    const stateCount: Record<string, number> = {};
    
    members.forEach((member: Member) => {
      const { city, state } = member;
      if (city) {
        cityCount[city] = (cityCount[city] || 0) + 1;
      }
      if (state) {
        stateCount[state] = (stateCount[state] || 0) + 1;
      }
    });
    
    const cityStatistics = Object.keys(cityCount).map((city) => ({
      label: city,
      value: cityCount[city],
      percentage: ((cityCount[city] / totalMembers) * 100).toFixed(2),
      fill: getRandomColor(),
    }));
    
    const stateStatistics = Object.keys(stateCount).map((state) => ({
      label: state,
      value: stateCount[state],
      percentage: ((stateCount[state] / totalMembers) * 100).toFixed(2),
      fill: getRandomColor(),
    }));
    
    return {
      data: {
        marital: maritalStatusChart,
        gender: genderChart,
        children: childrenChart,
        age: ageStatistics,
        city: cityStatistics,
        state: stateStatistics,
      }
    };
  } catch (err) {
    return { error: "Erro ao buscar estatísticas." };
  }
}

function getRandomColor(): string {
  const colors = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FFB6C1", "#8A2BE2", "#7FFF00", "#FFD700"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

