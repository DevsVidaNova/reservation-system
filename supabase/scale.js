const supabase = require('../config/supabaseClient');
const express = require("express");
const middleware = require('./middleware')
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');

const router = express.Router();
dayjs.extend(customParseFormat);

// 📌 1. Criar uma nova escala
async function createScale(req, res) {
    const { date, band, name, projection, light, transmission, camera, live, sound, training_sound, photography, stories, dynamic, direction } = req.body;
    if (!date || !direction || !name) {
        return res.status(400).json({ error: "Faltam dados obrigatórios: 'date', 'band', 'projection','name', ou 'direction'." });
    }

    try {
        const formattedDate = dayjs(date, 'DD/MM/YYYY').format('YYYY-MM-DD');
        if (!dayjs(formattedDate).isValid()) {
            return res.status(400).json({ error: "Data inválida." });
        }

        const { data, error: insertError } = await supabase
            .from("scales")
            .insert([{
                date: formattedDate,
                name,
                band,
                projection,
                light,
                transmission,
                camera,
                live,
                sound,
                training_sound,
                photography,
                stories,
                dynamic,
                direction,
            }]);

        if (insertError) {
            console.error("Erro ao inserir escala:", insertError);
            return res.status(400).json({ error: insertError.message });
        }

        res.status(201).json({ message: "Escala criada com sucesso.", });
    } catch (err) {
        console.error("Erro ao criar escala:", err);  // Log detalhado para depuração
        res.status(500).json({ error: "Erro ao criar escala." });
    }
}

// 📌 2. Listar todas as escalas
async function getAllScales(req, res) {
    try {
        // Obtém todas as escalas com o nome da banda, data, direção, confirmações e detalhes dos usuários
        const { data, error } = await supabase
            .from("scales")
            .select(`
                id,
                date,
                name,
                projection:projection(id), 
                light:light(id),
                transmission:transmission(id),
                camera:camera(id),
                live:live(id),
                sound:sound(id),
                training_sound:training_sound(id),
                photography:photography(id),
                stories:stories(id),
                dynamic:dynamic(id),
                direction:direction(id, name, phone, email),
                band:band(id, name, phone, email),
                scale_confirmations:scale_confirmations(user_id, confirmed)
            `);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Função para calcular a porcentagem de confirmações
        const calculatePercentageConfirmed = (scale) => {
            const userFields = [
                "projection", "light", "transmission", "camera", "live",
                "sound", "training_sound", "photography", "stories", "dynamic", "direction", "band"
            ];

            // Contagem de usuários
            const totalUsers = userFields.filter(field => scale[field] !== null).length;

            // Contagem de confirmações
            const confirmedUsers = scale.scale_confirmations.filter(conf => conf.confirmed).length;

            // Calcula a porcentagem de confirmações
            return totalUsers > 0 ? ((confirmedUsers / totalUsers) * 100).toFixed(2) : 0;
        };

        const formatUser = (scale, userField) => {
            const user = scale[userField];  // Usa 'scale' corretamente
            return user ? {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                confirmed: scale.scale_confirmations?.find(conf => conf.user_id === user.id)?.confirmed || false
            } : null;
        };
        
        
        const formattedData = data.map(scale => {
            const percentageConfirmed = calculatePercentageConfirmed(scale);

            return {
                id: scale.id,
                name: scale.name,
                date: dayjs(scale.date).format('DD/MM/YYYY'), // Formata a data
                direction: formatUser(scale, 'direction'),  
                band: formatUser(scale, 'band'),
                confirmations: scale.scale_confirmations.filter(conf => conf.confirmed).length, // Contagem de confirmações
                percentage_confirmed: percentageConfirmed, // Porcentagem de confirmações
            };
        });

        res.status(200).json(formattedData);
    } catch (err) {
        console.error("Erro ao listar todas as escalas:", err);
        res.status(500).json({ error: "Erro ao listar todas as escalas." });
    }
}

// 📌 3. Buscar uma escala por ID
async function getScaleById(req, res) {
    const { id } = req.params; // O ID da escala vem da URL

    try {
        // Busca a escala pelo ID com os detalhes dos usuários e confirmações
        const { data, error } = await supabase
            .from("scales")
            .select(`
                *,
                projection:projection(id, name, phone, email), 
                light:light(id, name, phone, email),
                transmission:transmission(id, name, phone, email),
                camera:camera(id, name, phone, email),
                live:live(id, name, phone, email),
                sound:sound(id, name, phone, email),
                training_sound:training_sound(id, name, phone, email),
                photography:photography(id, name, phone, email),
                stories:stories(id, name, phone, email),
                dynamic:dynamic(id, name, phone, email),
                direction:direction(id, name, phone, email),
                band:band(id, name, phone, email),
                scale_confirmations:scale_confirmations(user_id, confirmed)
            `)
            .eq("id", id)
            .single();

        if (error) {
            return res.status(404).json({ error: "Escala não encontrada." });
        }

        const userFields = [
            "projection", "light", "transmission", "camera", "live",
            "sound", "training_sound", "photography", "stories", "dynamic", "direction","band"
        ];

        // Contagem de confirmações
        const totalUsers = userFields.filter(field => data[field] !== null).length;

        // Quantidade de confirmações já registradas (scale_confirmations já retorna só os confirmados)
        const confirmedUsers = data.scale_confirmations.filter(conf => conf.confirmed).length;

        // Calcula a porcentagem de confirmações
        const percentageConfirmed = totalUsers > 0 ? ((confirmedUsers / totalUsers) * 100).toFixed(2) : 0;


        // Formata a resposta
        const formatUser = (userField) => {
            const user = data[userField];
            return user ? {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                confirmed: data.scale_confirmations?.find(conf => conf.user_id === user.id)?.confirmed || false
            } : null;
        };

        const formattedData = {
            ...data,
            date: dayjs(data.date).format('DD/MM/YYYY'), // Formata a data
            projection: formatUser('projection'),
            light: formatUser('light'),
            transmission: formatUser('transmission'),
            camera: formatUser('camera'),
            live: formatUser('live'),
            sound: formatUser('sound'),
            training_sound: formatUser('training_sound'),
            photography: formatUser('photography'),
            stories: formatUser('stories'),
            dynamic: formatUser('dynamic'),
            direction: formatUser('direction'),
            band: formatUser('band'),
            percentage_confirmed: percentageConfirmed 
        };

        res.status(200).json(formattedData);
    } catch (err) {
        console.error("Erro ao listar escala por ID:", err);
        res.status(500).json({ error: "Erro ao listar escala por ID." });
    }
}

// 📌 4. Atualizar uma escala (somente os campos enviados)
async function updateScale(req, res) {
    const { id } = req.params; // ID da escala a ser atualizada
    const { date, band, name, projection, light, transmission, camera, live, sound, training_sound, photography, stories, dynamic, direction } = req.body;

    if (!id) {
        return res.status(400).json({ error: "O ID da escala é obrigatório." });
    }

    try {
        // Busca os dados atuais da escala para manter os não enviados
        const { data: existingScale, error: fetchError } = await supabase
            .from("scales")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError || !existingScale) {
            return res.status(404).json({ error: "Escala não encontrada." });
        }

        const updatedScale = {
            date: date ? dayjs(date, 'DD/MM/YYYY').format('YYYY-MM-DD') : existingScale.date,
            name: name ?? existingScale.name,
            band: band ?? existingScale.band,
            projection: projection ?? existingScale.projection,
            light: light ?? existingScale.light,
            transmission: transmission ?? existingScale.transmission,
            camera: camera ?? existingScale.camera,
            live: live ?? existingScale.live,
            sound: sound ?? existingScale.sound,
            training_sound: training_sound ?? existingScale.training_sound,
            photography: photography ?? existingScale.photography,
            stories: stories ?? existingScale.stories,
            dynamic: dynamic ?? existingScale.dynamic,
            direction: direction ?? existingScale.direction,
        };

        const { error: updateError } = await supabase
            .from("scales")
            .update(updatedScale)
            .eq("id", id);

        if (updateError) {
            console.error("Erro ao atualizar escala:", updateError);
            return res.status(400).json({ error: updateError.message });
        }

        res.status(200).json({ message: "Escala atualizada com sucesso." });
    } catch (err) {
        console.error("Erro ao atualizar escala:", err);
        res.status(500).json({ error: "Erro ao atualizar escala." });
    }
}

// 📌 5. Deletar uma escala
async function deleteScale(req, res) {
    const { id } = req.params;
    try {
        // Exclui a escala
        const { data, error } = await supabase
            .from("scales")
            .delete()
            .eq("id", id)
            .single();

        if (error) {
            return res.status(404).json({ error: "Escala não encontrada." });
        }

        res.status(200).json({ message: "Escala excluída com sucesso." });
    } catch (err) {
        console.error("Erro ao excluir escala:", err);
        res.status(500).json({ error: "Erro ao excluir escala." });
    }
}

// 📌 6. Gerar um relatório de escalas
async function generateAnalytics(req, res) {
    try {
        // Relatório de escalas por função
        const { data, error } = await supabase
            .from("scales")
            .select("role, COUNT(*)")
            .group("role");

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error("Erro ao gerar relatório:", err);
        res.status(500).json({ error: "Erro ao gerar relatório." });
    }
}

// 📌 7. Obter escalas de um usuário específico
async function getUserScales(req, res) {
    const userId = req.profile.id;
    try {
        // Busca escalas do usuário, incluindo o nome do usuário de 'direction' e a contagem de confirmações
        const { data, error } = await supabase
            .from("scales")
            .select(`
                id,
                date,
                name,
                band:user_profiles!fk_band(name),
                direction:user_profiles!fk_direction(name),
                scale_confirmations(count)
            `)
            .or(
                `projection.eq.${userId},light.eq.${userId},transmission.eq.${userId},camera.eq.${userId},live.eq.${userId},sound.eq.${userId},training_sound.eq.${userId},photography.eq.${userId},stories.eq.${userId},dynamic.eq.${userId},direction.eq.${userId},band.eq.${userId}`
            );

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Formata a resposta
        const formattedData = data.map(scale => ({
            id: scale.id,
            name: scale.name,
            date: dayjs(scale.date).format('DD/MM/YYYY'), // Formata a data
            direction: scale.direction, // Nome do responsável pela direção
            confirmations: scale.scale_confirmations[0]?.count || 0 // Contagem de confirmações
        }));

        res.status(200).json(formattedData);
    } catch (err) {
        console.error("Erro ao buscar escalas do usuário:", err);
        res.status(500).json({ error: "Erro ao buscar escalas do usuário." });
    }
}

// 📌 8. Confirmar ou desmarcar a confirmação de uma escala
async function confirmScale(req, res) {
    const { scaleId, confirmed } = req.body;
    const userId = req.profile.id;

    if (!scaleId || confirmed === undefined) {
        return res.status(400).json({ error: 'Dados incompletos para confirmação. Os campos scaleId e confirmed são obrigatórios.' });
    }

    try {
        const { data: scaleData, error: scaleError } = await supabase
            .from('scales')
            .select('*')
            .eq('id', scaleId)
            .single();

        if (scaleError || !scaleData) {
            return res.status(404).json({ error: 'Escala não encontrada.' });
        }

        const userRoles = [
            'band', 'projection', 'light', 'transmission', 'camera', 'live',
            'sound', 'training_sound', 'photography', 'stories', 'dynamic', 'direction'
        ];

        const isUserInScale = userRoles.some(role => scaleData[role] === userId);

        if (!isUserInScale) {
            return res.status(403).json({ error: 'Usuário não está escalado para essa escala.' });
        }

        const { data: existingConfirmation, error: findError } = await supabase
            .from('scale_confirmations')
            .select('*')
            .eq('scale_id', scaleId)
            .eq('user_id', userId)
            .single();

        if (findError && findError.code !== 'PGRST116') {  // Ignora erro de "registro não encontrado"
            return res.status(400).json({ error: 'Erro ao verificar confirmação. Tente novamente.' });
        }

        if (existingConfirmation) {
            const { data: updatedData, error: updateError } = await supabase
                .from('scale_confirmations')
                .update({ confirmed })
                .eq('id', existingConfirmation.id)
                .select();

            if (updateError) {
                return res.status(400).json({ error: 'Erro ao atualizar confirmação. Tente novamente.' });
            }

            return res.status(200).json({ message: 'Confirmação atualizada com sucesso.', confirmation: updatedData });
        }

        // Se não existir, cria uma nova confirmação
        const { data, error } = await supabase
            .from('scale_confirmations')
            .insert([{
                scale_id: scaleId,
                user_id: userId,
                confirmed,
            }])
            .select()
            .single();

        if (error) {
            console.log(error)
            return res.status(400).json({ error: 'Erro ao criar confirmação. Tente novamente.' });
        }

        return res.status(201).json({ message: 'Confirmação criada com sucesso.', confirmation: data });

    } catch (err) {
        console.error('Erro ao confirmar escala:', err);
        res.status(500).json({ error: 'Erro inesperado ao confirmar escala.' });
    }
}

// 📌 9. Pesquisar escala
async function searchScale(req, res) {
    const { name } = req.body;
    try {
      const { data, error } = await supabase.from("scales").select("*").ilike("name", `%${name}%`);
  
      if (error) return res.status(404).json({ error: "Sala não encontrada." });
  
      res.json(data);
    } catch (err) {
      console.error("Erro ao buscar sala:", err);
      res.status(500).json({ error: "Erro ao buscar sala." });
    }
}
  
// 📌 10. Duplicar escala
async function duplicateScale(req, res) {
    const { id } = req.params; // ID da escala original

    try {
        // Busca a escala original pelo ID
        const { data: originalScale, error } = await supabase
            .from("scales")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !originalScale) {
            return res.status(404).json({ error: "Escala não encontrada." });
        }

        // Remove o ID da escala original para evitar conflitos na inserção
        const { id: _, ...newScaleData } = originalScale;

        // Adiciona "(duplicado)" ao nome da escala
        newScaleData.name = `${newScaleData.name} (duplicado)`;

        // Insere a nova escala duplicada
        const { data: duplicatedScale, error: insertError } = await supabase
            .from("scales")
            .insert([newScaleData])
            .select()
            .single();

        if (insertError) {
            return res.status(400).json({ error: "Erro ao duplicar a escala." });
        }

        res.status(201).json(duplicatedScale);
    } catch (err) {
        console.error("Erro ao duplicar escala:", err);
        res.status(500).json({ error: "Erro interno ao duplicar escala." });
    }
}

router.route("/").post(middleware.requireAdmin, createScale);
router.route("/").get(middleware.requireAuth, getAllScales);
router.route("/confirm").post(middleware.requireAuth, confirmScale);
router.route("/my").get(middleware.requireAuth, getUserScales);
router.route("/analytics").put(middleware.requireAdmin, generateAnalytics);
router.route("/search").put(middleware.requireAdmin, searchScale);
router.route("/duplicate/:id").post(middleware.requireAdmin, duplicateScale);

router.route("/:id").delete(middleware.requireAdmin, deleteScale);
router.route("/:id").put(middleware.requireAdmin, updateScale);
router.route("/:id").get(middleware.requireAuth, getScaleById);

module.exports = router;
