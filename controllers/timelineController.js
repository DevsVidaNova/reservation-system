const Timeline = require("../models/Timeline");
const mongoose = require("mongoose");
const authenticateJWT = require("../middleware/authMiddleware");
const createTimeline = async (req, res) => {
  if (!req.userId) {
    return res.status(400).json({ message: "Usuário não autenticado" });
  }

  const Timeline = req.body;
  Timeline.user = req.userId;

  if (
    !Timeline.description ||
    !Timeline.room ||
    !Timeline.date ||
    !Timeline.startTime ||
    !Timeline.endTime
  ) {
    return res.status(400).json({
      message:
        "Todos os campos (description, room, date, startTime, endTime) são obrigatórios.",
    });
  }

  const [day, month, year] = Timeline.date.split("/");
  const formattedDate = `${year}-${month}-${day}`;
  Timeline.date = formattedDate;

  const startTime = new Date(`${formattedDate}T${Timeline.startTime}:00`);
  const endTime = new Date(`${formattedDate}T${Timeline.endTime}:00`);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return res
      .status(400)
      .json({ message: "Start time e end time devem ser datas válidas." });
  }

  Timeline.startTime = startTime;
  Timeline.endTime = endTime;

  try {
    const conflict = await Timeline.findOne({
      room: Timeline.room,
      date: Timeline.date,
      $or: [
        { startTime: { $lt: Timeline.endTime, $gt: Timeline.startTime } },
        { endTime: { $gt: Timeline.startTime, $lt: Timeline.endTime } },
        {
          startTime: { $lte: Timeline.startTime },
          endTime: { $gte: Timeline.endTime },
        },
        { startTime: { $gte: Timeline.startTime, $lt: Timeline.endTime } },
        { endTime: { $gt: Timeline.startTime, $lte: Timeline.endTime } },
      ],
    });

    if (conflict) {
      return res
        .status(409)
        .json({ message: "Conflito de horários para essa sala." });
    }

    const newTimeline = await new Timeline(Timeline).save();
    const populatedTimeline = await Timeline.findById(newTimeline._id).populate(
      "user",
      "email name"
    );
    console.log("Usuário associado à reserva:", populatedTimeline.user);
    const mailOptions = {
      from: "vidanovaoficial@gmail.com",
      to: populatedTimeline.user.email,
      subject: "Reserva Confirmada",
      text: `Olá ${populatedTimeline.user.name}, sua reserva foi confirmada:
      Sala: ${populatedTimeline.room}
      Descrição: ${populatedTimeline.description}
      Data: ${populatedTimeline.date}
      Início: ${populatedTimeline.startTime.toLocaleTimeString()}
      Fim: ${populatedTimeline.endTime.toLocaleTimeString()}
      `,
    };
    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: "Reserva criada com sucesso!" });
  } catch (err) {
    console.error("Erro ao salvar reserva:", err);
    res.status(500).json({ message: "Erro ao salvar reserva." });
  }
};

const getTimelines = async (req, res) => {
  try {
    const Timelines = await Timeline.find({}).populate("user");
    res.status(200).json(Timelines);
  } catch (err) {
    console.error("Erro ao buscar agendamentos:", err);
    res.status(500).json({ message: "Erro ao buscar agendamentos" });
  }
};

const deleteTimeline = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const Timeline = await Timeline.findById(id);

    if (!Timeline) {
      return res.status(404).json({ message: "Reserva não encontrada" });
    }

    await Timeline.remove();
    res.status(200).json({
      message: "Reserva deletada com sucesso",
      Timeline: { id: Timeline._id, description: Timeline.description },
    });
  } catch (error) {
    console.error("Erro ao deletar reserva:", error);
    res.status(500).json({
      message: "Erro ao deletar reserva",
      error: error.message,
    });
  }
};

const editTimeline = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  if (
    !updatedData.description ||
    !updatedData.room ||
    !updatedData.date ||
    !updatedData.startTime ||
    !updatedData.endTime
  ) {
    return res.status(400).json({
      message: "Todos os campos são obrigatórios.",
    });
  }

  const [day, month, year] = updatedData.date.split("/");
  const formattedDate = `${year}-${month}-${day}`;
  updatedData.date = formattedDate;

  const startTime = new Date(`${formattedDate}T${updatedData.startTime}:00`);
  const endTime = new Date(`${formattedDate}T${updatedData.endTime}:00`);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return res
      .status(400)
      .json({ message: "Start time e end time devem ser datas válidas." });
  }

  updatedData.startTime = startTime;
  updatedData.endTime = endTime;

  try {
    const Timeline = await Timeline.findById(id);

    if (!Timeline) {
      return res.status(404).json({ message: "Reserva não encontrada" });
    }

    const conflict = await Timeline.findOne({
      room: updatedData.room,
      date: updatedData.date,
      $or: [
        {
          startTime: { $lt: updatedData.endTime, $gte: updatedData.startTime },
        },
        { endTime: { $gt: updatedData.startTime, $lte: updatedData.endTime } },
      ],
    });

    if (conflict) {
      return res
        .status(409)
        .json({ message: "Conflito de horários para essa sala." });
    }

    await Timeline.findByIdAndUpdate(id, updatedData, { new: true });

    res.status(200).json({
      message: "Reserva atualizada com sucesso",
      Timeline: { id, description: updatedData.description },
    });
  } catch (err) {
    console.error("Erro ao atualizar reserva:", err);
    res.status(500).json({ message: "Erro ao atualizar reserva." });
  }
};

module.exports = {
  createTimeline: [authenticateJWT, createTimeline],
  getTimelines,
  deleteTimeline,
  editTimeline,
};
