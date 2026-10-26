# EManage - Event RSVP & Attendance Data Engine

Comprehensive event management, RSVP and attendance tracking with automated Python data processing, organization, and analytics.

---

## 📱 How to Turn This App into a Real Android APK (Step-by-Step Guide)

### Paraan 1: Gamit ang GitHub + Render + PWABuilder (Pinakamadali at Libre, May Tunay na .APK File!)

#### Hakbang 1: I-upload ang Project sa GitHub
1. Buksan ang Terminal sa VS Code kung saan nandun ang project mo.
2. Patakbuhin ang mga sumusunod na commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for EManage"
   ```
3. Pumunta sa [github.com](https://github.com), mag-login at gumawa ng **New Repository** (hal. `emanage-event-tracker`).
4. I-link at i-push ang iyong code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/emanage-event-tracker.git
   git push -u origin main
   ```

#### Hakbang 2: I-deploy sa Render.com (Libreng Web Service)
1. Mag-sign up o mag-log in sa [render.com](https://render.com).
2. I-click ang **New +** > **Web Service**.
3. Piliin ang **Build and deploy from a Git repository** at ikabit ang iyong GitHub repository (`emanage-event-tracker`).
4. Ilagay ang settings:
   - **Name:** `emanage-event-tracker`
   - **Environment:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Plan:** `Free`
5. I-click ang **Create Web Service**. Hintayin matapos ang build.
6. Makakakuha ka ng live public URL (hal. `https://emanage-event-tracker.onrender.com`).

#### Hakbang 3: I-convert sa Tunay na APK File gamit ang PWABuilder
1. Buksan ang [pwabuilder.com](https://www.pwabuilder.com) sa iyong browser (Official Microsoft Open Source Tool).
2. I-paste ang iyong Render URL (halimbawa: `https://emanage-event-tracker.onrender.com`).
3. I-click ang **Start**.
4. Kapag nasuri na, i-click ang **Package for Stores** > **Android**.
5. I-download ang generated package — makukuha mo ang tunay na `.apk` file na puwedeng i-install agad sa kahit anong Android phone o i-upload sa Google Play Store!

---

### Paraan 2: Instant PWA WebAPK (Direktang Install sa Android Phone nang Walang Download Tool)
Dahil may kasama na itong PWA (Progressive Web App) Service Worker at Manifest:
1. Buksan ang iyong Render URL sa Google Chrome sa iyong Android phone.
2. May lalabas na prompt o i-click ang tatlong tuldok (⋮) sa kanang itaas ng Chrome.
3. Piliin ang **"Install app"** o **"Add to Home screen"**.
4. Awtomatikong gagawa ang Android OS ng tunay na WebAPK na may sariling icon sa app drawer, splash screen, at standalone interface!

---

### Paraan 3: Gamit ang Capacitor / Android Studio (Full Native APK)
Kung gusto mong mag-compile sa Android Studio:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init EManage com.emanage.app --web-dir dist
npm run build
npx cap add android
npx cap copy
npx cap open android
```
Sa loob ng Android Studio, i-click ang **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run dev server (Fullstack React + Vite + Express + Python Data Processor)
npm run dev

# 3. Production build
npm run build

# 4. Run production server
npm run start
```
