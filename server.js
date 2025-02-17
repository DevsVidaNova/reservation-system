const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser')

const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(cors());

/*
const connectDB = require('./config/moongose');
connectDB();
app.use('/rooms', require('./routes/roomRoute'))
app.use('/users', require('./routes/userRoutes'));

app.use('/bookings', require('./routes/bookingRoute'));
app.use("/api/auth", require("./routes/authRoute"));
app.use('/stats', require('./routes/statsRoute'));
*/

//SUPABASE

app.use('/room', require('./supabase/room'));
app.use('/booking', require('./supabase/booking'));
app.use('/auth', require('./supabase/auth'));
app.use('/analytics', require('./supabase/analytics'));
app.use('/user', require('./supabase/user'));
app.use('/scale', require('./supabase/scale'));


app.get("/ping",(req, res) => {
  return res.status(200).send('Pong');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`);
});
