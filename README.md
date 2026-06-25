# 🍽️ Hall Dining Management System
**Node.js + Express + MongoDB — Free Deployment Guide**

---

## 📦 ফাইল স্ট্রাকচার

```
dining-app/
├── server.js          ← Express backend (API + static serve)
├── package.json
├── render.yaml        ← Render deploy config
├── .env.example       ← Environment variables template
└── public/
    └── index.html     ← Frontend (Bengali dining app)
```

---

## 🚀 ধাপে ধাপে Deploy করুন (সম্পূর্ণ বিনামূল্যে)

### ধাপ ১: MongoDB Atlas (বিনামূল্যে Database)

1. **https://mongodb.com/atlas** → Register করুন
2. **New Project** → "dining" নাম দিন
3. **Create Deployment** → **M0 Free** (512MB, যথেষ্ট 300+ ছাত্রের জন্য)
4. Cloud Provider: **AWS**, Region: **ap-southeast-1 (Singapore)** (বাংলাদেশের কাছাকাছি)
5. **Username & Password** তৈরি করুন (মনে রাখুন!)
6. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
7. **Connect** → **Drivers** → Connection string কপি করুন:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
8. Connection string-এ `/?` এর আগে `/dining` যোগ করুন:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/dining?retryWrites=true&w=majority
   ```

---

### ধাপ ২: GitHub-এ Code Upload করুন

1. **https://github.com** → **New repository** → "hall-dining" নাম দিন
2. **Public** রাখুন → **Create repository**
3. আপনার কম্পিউটারে Terminal খুলুন:
   ```bash
   cd dining-app
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/hall-dining.git
   git push -u origin main
   ```

---

### ধাপ ৩: Render-এ Deploy করুন

1. **https://render.com** → GitHub দিয়ে Sign up করুন
2. **New +** → **Web Service**
3. GitHub repository connect করুন → **hall-dining** select করুন
4. Settings:
   - **Name**: `hall-dining`
   - **Region**: `Singapore (Southeast Asia)`
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
5. **Environment Variables** → **Add Environment Variable**:
   - Key: `MONGO_URI`
   - Value: (ধাপ ১ এর connection string)
6. **Create Web Service** → Deploy শুরু হবে

⏳ **৩-৫ মিনিট** অপেক্ষা করুন। Deploy শেষে URL পাবেন:
```
https://hall-dining.onrender.com
```

---

## ⚠️ গুরুত্বপূর্ণ নোট

### Render Free Tier সীমাবদ্ধতা:
- **Sleep after 15 min inactivity** — প্রথম request-এ ৩০-৫০ সেকেন্ড লাগবে wake up করতে
- এড়াতে: [UptimeRobot](https://uptimerobot.com) দিয়ে প্রতি ১৪ মিনিটে ping করুন (বিনামূল্যে)
  - New Monitor → HTTP → URL: `https://hall-dining.onrender.com/api/store`
  - Interval: 14 minutes

### Data Backup:
- অ্যাডমিন প্যানেল → মিল রেট সেটিং → **সম্পূর্ণ ব্যাকআপ নিন (JSON)** — এটা এখন MongoDB থেকে export করে
- পুনরুদ্ধার: **ব্যাকআপ থেকে পুনরুদ্ধার করুন**

---

## 🔧 Local Development (নিজের কম্পিউটারে চালানো)

```bash
# .env file তৈরি করুন
cp .env.example .env
# .env ফাইলে MONGO_URI দিন

# Dependencies install করুন
npm install

# Server চালু করুন
npm start
# → http://localhost:3000 এ খুলুন
```

---

## 📊 ক্যাপাসিটি (বিনামূল্যের সীমার মধ্যে)

| MongoDB Atlas M0 | Render Free |
|---|---|
| 512MB storage | 750 hours/month |
| Unlimited reads/writes | Shared CPU |
| 300+ ছাত্রের জন্য যথেষ্ট | বাংলাদেশ থেকে ব্যবহারযোগ্য |

---

## 🆘 সমস্যা হলে

**"Application error" দেখালে:**
- Render Dashboard → Logs দেখুন
- সাধারণত MONGO_URI ভুল হলে হয়

**Data load হচ্ছে না:**
- Browser Console (F12) → Network tab → `/api/store` request check করুন

**MongoDB connection failed:**
- Atlas → Network Access → 0.0.0.0/0 allow আছে কিনা দেখুন
