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
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now },
});
storeSchema.index({ key: 1 });
const Store = mongoose.model('Store', storeSchema);

// ==================== API: Key-Value Store ====================
// GET /api/store/:key
app.get('/api/store/:key', async (req, res) => {
  try {
    const doc = await Store.findOne({ key: req.params.key });
    if (!doc) return res.json({ found: false, value: null });
    res.json({ found: true, value: doc.value });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/store/:key  { value: ... }
app.post('/api/store/:key', async (req, res) => {
  try {
    const { value } = req.body;
    await Store.findOneAndUpdate(
      { key: req.params.key },
      { value, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/store/:key
app.delete('/api/store/:key', async (req, res) => {
  try {
    await Store.deleteOne({ key: req.params.key });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/store  — all keys (for backup/export)
app.get('/api/store', async (req, res) => {
  try {
    const docs = await Store.find({}, { key: 1, value: 1, _id: 0 });
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/store-bulk  — import backup
app.post('/api/store-bulk', async (req, res) => {
  try {
    const { items } = req.body; // [{key, value}]
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
    res.status(500).json({ error: e.message });
  }
});

// ==================== Connect & Start ====================
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dining';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
