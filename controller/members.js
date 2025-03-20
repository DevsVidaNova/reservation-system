import express from "express";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import supabase from "../config/supabaseClient.js";
import middleware from "./middleware.js";
import translateError from "../utils/errors.js";
const router = express.Router();
dayjs.extend(customParseFormat);

// 📌 1. Criar um novo membro
async function createMember(req, res) {
  const { full_name, birth_date, gender, cpf, rg, phone, email, street, number, neighborhood, city, state, cep, mother_name, father_name, marital_status, has_children, children_count } = req.body;

  //available_days, available_hours, interests, skills, health_restrictions, previous_volunteering, previous_volunteering_place
  if (!full_name || !birth_date || !gender || !phone || !email) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }
  const formattedBirthDate = dayjs(birth_date, "DD/MM/YYYY").format("YYYY-MM-DD");
  try {
    const { data, error } = await supabase
      .from("members")
      .insert([{ full_name, birth_date: formattedBirthDate, gender, cpf, rg, phone, email, street, number, neighborhood, city, state, cep, mother_name, father_name, marital_status, has_children, children_count }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Erro ao criar membro:", err);
    res.status(500).json({ code: err.code, message: translateError(err) });
  }
}

// 📌 2. Listar todos os membros
async function getMembers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 15;

    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from("members")
      .select("*", { count: "exact" })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const formattedData = data.map(member => ({
      ...member,
      birth_date: dayjs(member.birth_date).format("DD/MM/YYYY")
    }));

    res.json({
      members: formattedData,
      pagination: {
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      }
    });

  } catch (err) {
    console.error("Erro ao buscar membros:", err);
    res.status(500).json({ error: "Erro ao buscar membros." });
  }
}

// 📌 3. Buscar um membro por ID
async function getMemberById(req, res) {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from("members").select("*").eq("id", id).single();

    if (error) return res.status(404).json({ error: "Membro não encontrado." });

    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar membro:", err);
    res.status(500).json({ error: "Erro ao buscar membro." });
  }
}

// 📌 4. Atualizar um membro (somente os campos enviados)
async function updateMember(req, res) {
  const { id } = req.params;
  const updates = req.body;

  if (updates.birth_date) {
    const formattedBirthDate = dayjs(updates.birth_date, "DD/MM/YYYY").format("YYYY-MM-DD");
    updates.birth_date = formattedBirthDate;  // Substituindo o valor da data formatada
  }
  try {
    const { data, error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    console.error("Erro ao atualizar membro:", err);
    res.status(500).json({ error: "Erro ao atualizar membro." });
  }
}

// 📌 5. Deletar um membro
async function deleteMember(req, res) {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Membro deletado com sucesso." });
  } catch (err) {
    console.error("Erro ao deletar membro:", err);
    res.status(500).json({ error: "Erro ao deletar membro." });
  }
}

// 📌 6. Pesquisar membro pelo nome
async function searchMember(req, res) {
  const { full_name } = req.body;
  try {
    const { data, error } = await supabase.from("members").select("*").ilike("full_name", `%${full_name}%`);

    if (error) return res.status(404).json({ error: "Membro não encontrado." });

    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar membro:", err);
    res.status(500).json({ error: "Erro ao buscar membro." });
  }
}

// 📌 7. Buscar com filtros genéricos
async function searchByFilter(req, res) {
  const { field, value, operator } = req.body;

  if (!field || value === undefined || !operator) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  try {
    let query = supabase.from("members").select("*");

    switch (operator) {
      case "eq":
        query = query.eq(field, value);
        break;
      case "neq":
        query = query.neq(field, value);
        break;
      case "gt":
        query = query.gt(field, value);
        break;
      case "gte":
        query = query.gte(field, value);
        break;
      case "lt":
        query = query.lt(field, value);
        break;
      case "lte":
        query = query.lte(field, value);
        break;
      case "like":
        query = query.like(field, value);
        break;
      case "ilike":
        query = query.ilike(field, value);
        break;
      default:
        return res.status(400).json({ error: "Operador inválido." });
    }

    const { data, error } = await query;

    if (error) return res.status(404).json({ error: "Nenhum resultado encontrado." });

    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar com filtro:", err);
    res.status(500).json({ error: "Erro ao buscar com filtro." });
  }
}


// 📌 8. Listar estatisticas
async function getAnalytics(req, res) {
  try {
    const { data: members, error } = await supabase.from("members").select("*");

    if (error) {
      return res.status(500).json({ error: "Erro ao buscar membros." });
    }

    const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];

    const totalMembers = members.length;

    // 🔹 Estatísticas por Estado Civil
    const maritalStatusCount = members.reduce((acc, member) => {
      acc[member.marital_status] = (acc[member.marital_status] || 0) + 1;
      return acc;
    }, {});

    const maritalStatusChart = Object.keys(maritalStatusCount).map((status, index) => ({
      label: status,
      value: maritalStatusCount[status],
      percentage: ((maritalStatusCount[status] / totalMembers) * 100).toFixed(2),
      fill: colors[index % colors.length],
    }));

    // 🔹 Estatísticas por Gênero
    const genderCount = members.reduce((acc, member) => {
      acc[member.gender] = (acc[member.gender] || 0) + 1;
      return acc;
    }, {});

    const genderChart = Object.keys(genderCount).map((gender, index) => ({
      label: gender,
      value: genderCount[gender],
      percentage: ((genderCount[gender] / totalMembers) * 100).toFixed(2),
      fill: colors[index % colors.length],
    }));

    // 🔹 Estatísticas por Quantidade de Filhos
    const childrenCount = members.reduce((acc, member) => {
      acc[member.children_count] = (acc[member.children_count] || 0) + 1;
      return acc;
    }, {});

    const childrenChart = Object.keys(childrenCount).map((count, index) => ({
      label: `${count} filhos`,
      value: childrenCount[parseInt(count)],
      percentage: ((childrenCount[parseInt(count)] / totalMembers) * 100).toFixed(2),
      fill: colors[index % colors.length],
    }));

    // 🔹 Estatísticas por Faixa Etária (Idade)
    const calculateAge = (birthDate) => {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const month = today.getMonth();
      if (month < birth.getMonth() || (month === birth.getMonth() && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const ageRanges = {
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46-55": 0,
      "56+": 0,
    };

    members.forEach((member) => {
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

    // 🔹 Estatísticas por Região (Cidade/Estado)
    const cityCount = {};
    const stateCount = {};

    members.forEach((member) => {
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

    // 🔹 Retorna todas as estatísticas para o frontend
    res.json({
      marital: maritalStatusChart,
      gender: genderChart,
      children: childrenChart,
      age: ageStatistics,
      city: cityStatistics,
      state: stateStatistics,
    });
  } catch (err) {
    console.error("Erro ao buscar com filtro:", err);
    res.status(500).json({ error: "Erro ao buscar com filtro." });
  }
}

// Função para gerar cor aleatória
function getRandomColor() {
  const colors = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FFB6C1", "#8A2BE2", "#7FFF00", "#FFD700"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}



// 📌 0. Rotas com Middleware
router.route("/").post(middleware.requireAdmin, createMember);
router.route("/").get(middleware.publicRoute, getMembers);
router.route("/search").get(middleware.publicRoute, searchMember);
router.route("/filter").post(middleware.publicRoute, searchByFilter);
router.route("/analytics").get(middleware.requireAdmin, getAnalytics);

router.route("/:id").delete(middleware.requireAdmin, deleteMember);
router.route("/:id").get(middleware.publicRoute, getMemberById);
router.route("/:id").put(middleware.requireAdmin, updateMember);

export default router;
