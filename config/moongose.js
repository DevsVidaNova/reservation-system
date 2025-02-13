// db.js
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Conectado ao MongoDB!");
  } catch (err) {
    console.error("Erro ao conectar ao MongoDB:", err);
    process.exit(1); // Finaliza o processo caso a conexão falhe
  }
};

module.exports = connectDB;
