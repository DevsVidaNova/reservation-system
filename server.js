const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser')

const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(cors());

app.use('/room', require('./supabase/room'));
app.use('/booking', require('./supabase/booking'));
app.use('/auth', require('./supabase/auth'));
app.use('/analytics', require('./supabase/analytics'));
app.use('/user', require('./supabase/user'));
app.use('/scale', require('./supabase/scale'));
app.use('/members', require('./supabase/members'));

app.get("/ping",(req, res) => {
  return res.status(200).send('Pong');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`);
});
