const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;
require('dotenv').config();
//review code

const uri = process.env.MONGO_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("Conectado ao MongoDB!");
})
.catch((err) => {
  console.error("Erro ao conectar ao MongoDB:", err);
  process.exit(1);
});

app.use(bodyParser.json());
app.use(cors());

app.use('/bookings', require('./routes/bookingRoute'));
app.use("/api/auth", require("./routes/authRoute"));
app.use('/rooms', require('./routes/roomRoute'))
app.use('/users', require('./routes/userRoutes'));
app.use('/stats', require('./routes/statsRoute'));

const User = require("./models/user");

app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.status(200).json(users);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
});

app.get("/ping",(req, res) => {
  return res.status(200).send('Pong');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
