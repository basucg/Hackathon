const path = require('path');
const express = require('express');
const cors = require('cors');
const robotRoutes = require('./routes/robotRoutes');
const authRoutes = require('./routes/authRoutes');
const { requireAuth } = require('./middleware/requireAuth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/robots', requireAuth, robotRoutes);
app.use('/api/*', (_, res) => {
  res.status(404).json({ error: 'API route not found' });
});

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Robot Management server listening on http://localhost:${PORT}`);
});
