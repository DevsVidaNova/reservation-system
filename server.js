const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bodyParser = require('body-parser');
const connectDB = require('./config/mongoose');

const app = express();
const port = 8080;

connectDB();

app.use(bodyParser.json());
app.use(cors());

app.use('/bookings', require('./routes/bookingRoute'));
app.use("/api/auth", require("./routes/authRoute"));
app.use('/rooms', require('./routes/roomRoute'))
app.use('/users', require('./routes/userRoutes'));
app.use('/stats', require('./routes/statsRoute'));
app.use('/timelines', require('./routes/timelineRoute'));







app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`);
});
