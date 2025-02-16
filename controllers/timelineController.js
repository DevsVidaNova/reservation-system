const supabase = require('../config/supabaseClient');

// Cria uma nova timeline
exports.createTimeline = async (req, res) => {
  const { data, error } = await supabase
    .from('timeline')
    .insert([req.body]);

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

// Obtém todas as timeline
exports.getTimeline = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('timelines') 
      .select('*'); 
    if (error) {
      console.error('Erro ao buscar timeline:', error);
      console.log(error);
      return res.status(400).json({ error: error.message });
    }
    res.status(200).json(data);  
  } catch (err) {
    console.error('Erro no servidor:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};


// Atualiza uma timeline pelo ID
exports.updateTimeline = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('timeline')
    .update(req.body)
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
};

// Deleta uma timeline pelo ID
exports.deleteTimeline = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('timeline')
    .delete()
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json({ message: 'Timeline deletada com sucesso' });
};

// Obtém uma timeline pelo ID
exports.getTimelineById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('timeline')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
};

// Pesquisa timeline com base em critérios
exports.searchTimeline = async (req, res) => {
  const { title } = req.body;
  const { data, error } = await supabase
    .from('timeline')
    .select('*')
    .ilike('title', `%${title}%`);

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
};

// Duplica uma timeline
exports.duplicateTimeline = async (req, res) => {
  const { id } = req.body;
  const { data: original, error } = await supabase
    .from('timeline')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(400).json({ error: error.message });

  const { data, error: insertError } = await supabase
    .from('timeline')
    .insert([{ ...original, id: undefined }]);

  if (insertError) return res.status(400).json({ error: insertError.message });
  res.status(201).json(data);
};
