const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// ==================== MongoDB Schema ====================
const storeSchema = new mongoose.Schema({
  key:       { type: String, required: true, unique: true },
  value:     { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now },
});
storeSchema.index({ key: 1 });
const Store = mongoose.model('Store', storeSchema);

// ==================== Health Check ====================
// Frontend এই endpoint দিয়ে server আছে কিনা বুঝতে পারে
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  if (dbState === 1) {
    res.json({ ok: true, db: 'connected' });
  } else {
    res.status(503).json({ ok: false, db: 'disconnected' });
  }
});

// ==================== API: Key-Value Store ====================

// GET /api/store — সব keys (initCache + backup/export)
app.get('/api/store', async (req, res) => {
  try {
    const docs = await Store.find({}, { key: 1, value: 1, _id: 0 });
    res.json(docs);
  } catch (e) {
    console.error('GET /api/store error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/store/:key
app.get('/api/store/:key', async (req, res) => {
  try {
    const doc = await Store.findOne({ key: req.params.key });
    if (!doc) return res.json({ found: false, value: null });
    res.json({ found: true, value: doc.value });
  } catch (e) {
    console.error('GET /api/store/:key error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/store/:key  { value: ... }
app.post('/api/store/:key', async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'value required' });
    await Store.findOneAndUpdate(
      { key: req.params.key },
      { value, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/store/:key error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/store/:key
app.delete('/api/store/:key', async (req, res) => {
  try {
    await Store.deleteOne({ key: req.params.key });
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/store/:key error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/store-bulk  — backup restore
app.post('/api/store-bulk', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array required' });
    }
    const ops = items.map(({ key, value }) => ({
      updateOne: {
        filter: { key },
        update: { $set: { value, updatedAt: new Date() } },
        upsert: true,
      },
    }));
    await Store.bulkWrite(ops);
    res.json({ ok: true, count: items.length });
  } catch (e) {
    console.error('POST /api/store-bulk error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ==================== Connect & Start ====================
const PORT     = process.env.PORT      || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dining';

mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
mongoose.connection.on('reconnected',  () => console.log('✅ MongoDB reconnected'));
mongoose.connection.on('error', err   => console.error('❌ MongoDB error:', err.message));

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,  // 5s timeout
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ MongoDB connected:', MONGO_URI.replace(/:\/\/.*@/, '://***@'));
    const server = app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n${signal} received — shutting down...`);
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('✅ Graceful shutdown complete');
          process.exit(0);
        });
      });
      // Force exit যদি 10s-এর মধ্যে না হয়
      setTimeout(() => process.exit(1), 10_000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
