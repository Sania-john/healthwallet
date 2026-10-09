require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/records', require('./routes/records'));
app.use('/api/measurements', require('./routes/measurements'));
app.use('/api/share', require('./routes/share'));
app.get('/api/me', auth, (req, res) => res.json({ userId: req.userId }));

// handle upload errors (wrong file type, too large)
app.use((err, req, res, next) => {
  res.status(400).json({ message: err.message || 'Something went wrong' });
});

process.on('unhandledRejection', err => console.error('Unhandled rejection:', err));
process.on('uncaughtException', err => console.error('Uncaught exception:', err));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () => console.log('Server running on port ' + process.env.PORT));
  })
  .catch(err => console.error(err));