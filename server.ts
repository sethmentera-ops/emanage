import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Public shared URL calculation
const rawAppUrl = process.env.APP_URL || '';
const sharedAppUrl = rawAppUrl.replace('ais-dev-', 'ais-pre-');

// Persisted events database directory
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DbData {
  events: any[];
  rsvpResponses: any[];
  users: any[];
}

let dbData: DbData = {
  events: [],
  rsvpResponses: [],
  users: []
};

// Check if db.json exists, or if emanage_organized_data.json exists to bootstrap
if (fs.existsSync(DB_FILE)) {
  try {
    dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    if (!Array.isArray(dbData.users)) {
      dbData.users = [];
    }
    // Filter out legacy demo account from stored db.json
    dbData.users = dbData.users.filter(
      (u: any) => u.email !== 'jheanroseg@gmail.com' && u.name !== 'Jhean'
    );
  } catch (e) {
    console.error('Error reading db.json', e);
  }
}

// If events is empty, check if emanage_organized_data.json has pre-processed data
const organizedJsonFile = path.resolve(__dirname, 'emanage_organized_data.json');
if ((!dbData.events || dbData.events.length === 0) && fs.existsSync(organizedJsonFile)) {
  try {
    const org = JSON.parse(fs.readFileSync(organizedJsonFile, 'utf-8'));
    if (org.events_by_month) {
      const allEv: any[] = [];
      Object.values(org.events_by_month).forEach((evList: any) => {
        if (Array.isArray(evList)) {
          allEv.push(...evList);
        }
      });
      if (allEv.length > 0) {
        dbData.events = allEv;
        fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.error('Error importing from emanage_organized_data.json', err);
  }
}

const saveDb = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing db.json', e);
  }
};

// API: Public configuration
app.get('/api/config', (_req, res) => {
  res.json({
    appUrl: rawAppUrl,
    sharedAppUrl: sharedAppUrl || rawAppUrl,
  });
});

// --------------------------------------------------------------------------------------
// USER AUTHENTICATION & PERSISTENCE ENDPOINTS (Real User Accounts Only)
// --------------------------------------------------------------------------------------

// API: Get all registered users (filters out any demo user)
app.get('/api/users', (_req, res) => {
  const users = (dbData.users || [])
    .filter((u: any) => u.email !== 'jheanroseg@gmail.com' && u.name !== 'Jhean')
    .map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'Event Host & Admin',
      phone: u.phone || '',
      organization: u.organization || 'Personal Workspace',
      createdAt: u.createdAt || ''
    }));
  res.json(users);
});

// API: User Signup (Saves newly registered user from phone or browser)
app.post('/api/users/signup', (req, res) => {
  const { name, email, password, role, phone, organization, createdAt } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required signup fields' });
  }
  if (!Array.isArray(dbData.users)) {
    dbData.users = [];
  }
  const cleanEmail = email.trim().toLowerCase();
  const existingIdx = dbData.users.findIndex(
    (u: any) => u.email.toLowerCase() === cleanEmail
  );
  const userObj = {
    id: req.body.id || 'u_' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    password: String(password),
    role: role || 'Event Host & Admin',
    phone: phone || '',
    organization: organization || 'Personal Workspace',
    createdAt: createdAt || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  };
  if (existingIdx >= 0) {
    dbData.users[existingIdx] = userObj;
  } else {
    dbData.users.push(userObj);
  }
  saveDb();
  res.json({ success: true, user: userObj });
});

// API: Restore accounts from a device's local storage (only adds accounts the server is missing, never overwrites or deletes)
app.post('/api/users/restore', (req, res) => {
  const incoming = Array.isArray(req.body?.users) ? req.body.users : [];
  if (!Array.isArray(dbData.users)) dbData.users = [];
  let added = 0;
  for (const u of incoming) {
    if (!u || !u.email || !u.name || !u.password) continue;
    const cleanEmail = String(u.email).trim().toLowerCase();
    if (cleanEmail === 'jheanroseg@gmail.com') continue;
    if (dbData.users.some((x: any) => String(x.email).toLowerCase() === cleanEmail)) continue;
    dbData.users.push({
      id: u.id || 'u_' + Date.now() + '_' + added,
      name: String(u.name).trim(),
      email: cleanEmail,
      password: String(u.password),
      role: u.role || 'Event Host & Admin',
      phone: u.phone || '',
      organization: u.organization || 'Personal Workspace',
      createdAt: u.createdAt || ''
    });
    added++;
  }
  if (added > 0) saveDb();
  res.json({ success: true, added });
});

// API: User Login (Authenticates users who registered on their phones/devices)
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter your email and password' });
  }
  if (!Array.isArray(dbData.users)) {
    dbData.users = [];
  }
  const cleanInput = String(email).trim().toLowerCase();
  const user = dbData.users.find(
    (u: any) =>
      (u.email.toLowerCase() === cleanInput || u.name.toLowerCase() === cleanInput) &&
      String(u.password) === String(password)
  );
  if (user) {
    return res.json({ success: true, user });
  }
  return res.status(401).json({
    error: 'Invalid credentials. No registered account found with this email/password. Please create an account via Sign Up.'
  });
});

// API: Direct APK Download
app.get(['/api/download/apk', '/emanage.apk', '/download/apk'], (_req, res) => {
  const apkPath = path.resolve(__dirname, 'public', 'EManage-release.apk');
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="EManage-release.apk"');
  if (fs.existsSync(apkPath)) {
    return res.sendFile(apkPath);
  }
  res.redirect('/EManage-release.apk');
});


// --------------------------------------------------------------------------------------
// PYTHON DATA PROCESSOR ENDPOINTS
// --------------------------------------------------------------------------------------

// API: Run Python Processor
app.get('/api/python/run', (req, res) => {
  const pythonScript = path.resolve(__dirname, 'emanage_processor.py');
  const addSample = req.query.add_sample === 'true' ? ['--add-sample'] : [];
  const args = [pythonScript, '--json', ...addSample];

  const py = spawn('python3', args, { cwd: __dirname });

  let stdoutData = '';
  let stderrData = '';

  py.stdout.on('data', (chunk) => {
    stdoutData += chunk.toString();
  });

  py.stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
  });

  py.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({
        success: false,
        error: `Python process exited with code ${code}`,
        stderr: stderrData,
      });
    }

    try {
      const parsed = JSON.parse(stdoutData.trim());

      // If events were generated, sync them into dbData
      if (parsed.events_by_month) {
        const eventsList: any[] = [];
        Object.values(parsed.events_by_month).forEach((list: any) => {
          if (Array.isArray(list)) eventsList.push(...list);
        });
        if (eventsList.length > 0) {
          dbData.events = eventsList;
          saveDb();
        }
      }

      res.json({
        success: true,
        data: parsed,
        logs: stderrData,
      });
    } catch (parseErr: any) {
      res.json({
        success: true,
        rawOutput: stdoutData,
        logs: stderrData,
      });
    }
  });

  py.on('error', (err) => {
    res.status(500).json({
      success: false,
      error: `Failed to spawn Python: ${err.message}`,
    });
  });
});

// API: Get Python Source Code
app.get('/api/python/code', (_req, res) => {
  const pythonScript = path.resolve(__dirname, 'emanage_processor.py');
  try {
    if (fs.existsSync(pythonScript)) {
      const code = fs.readFileSync(pythonScript, 'utf-8');
      res.type('text/plain').send(code);
    } else {
      res.status(404).send('# emanage_processor.py not found');
    }
  } catch (err: any) {
    res.status(500).send(`# Error reading file: ${err.message}`);
  }
});

// API: Download Python file
app.get('/api/python/download', (_req, res) => {
  const pythonScript = path.resolve(__dirname, 'emanage_processor.py');
  if (fs.existsSync(pythonScript)) {
    res.download(pythonScript, 'emanage_processor.py');
  } else {
    res.status(404).json({ error: 'emanage_processor.py not found' });
  }
});

// API: Get Generated Markdown Report
app.get('/api/python/report', (_req, res) => {
  const reportPath = path.resolve(__dirname, 'emanage_summary_report.md');
  if (fs.existsSync(reportPath)) {
    res.type('text/markdown').send(fs.readFileSync(reportPath, 'utf-8'));
  } else {
    res.status(404).send('# Report has not been generated yet. Run Python Processor first.');
  }
});

// --------------------------------------------------------------------------------------
// EVENT & RSVP ENDPOINTS
// --------------------------------------------------------------------------------------

// API: Get all events
app.get('/api/events', (_req, res) => {
  res.json(dbData.events || []);
});

// API: Get single event by id
app.get('/api/events/:id', (req, res) => {
  const event = dbData.events.find((e: any) => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

// API: Sync events from organizer dashboard
app.post('/api/events/sync', (req, res) => {
  const { events } = req.body;
  if (Array.isArray(events)) {
    for (const ev of events) {
      const idx = dbData.events.findIndex((e: any) => e.id === ev.id);
      if (idx >= 0) {
        dbData.events[idx] = { ...dbData.events[idx], ...ev };
      } else {
        dbData.events.push(ev);
      }
    }
    saveDb();
  }
  res.json({ success: true, count: dbData.events.length, events: dbData.events });
});

function normalizeRsvpStatus(raw: string | undefined): 'Confirmed' | 'Declined' | 'Pending' {
  if (!raw) return 'Pending';
  const clean = raw.trim().toLowerCase();
  if (
    clean.includes('confirm') ||
    clean.includes('attending') ||
    clean.includes('yes') ||
    clean.includes('going') ||
    clean.includes('pupunta') ||
    clean.includes('oo') ||
    clean === 'attend' ||
    clean === 'y'
  ) {
    return 'Confirmed';
  }
  if (
    clean.includes('declin') ||
    clean.includes('cannot') ||
    clean.includes("can't") ||
    clean.includes('not attending') ||
    clean.includes('no') ||
    clean.includes('hindi') ||
    clean === 'absent' ||
    clean === 'n'
  ) {
    return 'Declined';
  }
  return 'Pending';
}

// API: Submit RSVP from guest phone or laptop
app.post('/api/rsvp', (req, res) => {
  const { eventId, guestName, guestEmail, rsvp, notes, eventDetails } = req.body;
  if (!eventId || !guestName || !guestEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const normalizedRsvp = normalizeRsvpStatus(rsvp);
  let event = dbData.events.find((e: any) => e.id === eventId);

  if (!event && eventDetails) {
    event = {
      id: eventId,
      title: eventDetails.title || 'Untitled Event',
      desc: eventDetails.desc || '',
      date: eventDetails.date || new Date().toISOString().slice(0, 10),
      time: eventDetails.time || '09:00 AM',
      location: eventDetails.location || 'Main Venue',
      month_display: eventDetails.month_display || 'October 2026',
      day_display: eventDetails.day_display || 'Oct\n05',
      max_guests: Number(eventDetails.max_guests) || 50,
      rsvp_count: 0,
      status: 'Upcoming',
      rsvp_link: 'https://forms.gle/aFGNLexpupZkvvpr8',
      guests: []
    };
    dbData.events.push(event);
  }

  if (event) {
    if (!Array.isArray(event.guests)) {
      event.guests = [];
    }
    const existingGuestIdx = event.guests.findIndex(
      (g: any) => g.email.toLowerCase() === guestEmail.toLowerCase() || g.name.toLowerCase() === guestName.toLowerCase()
    );
    const guestObj = {
      id: existingGuestIdx >= 0 ? event.guests[existingGuestIdx].id : 'g_' + Math.random().toString(36).substring(2, 9),
      name: guestName,
      email: guestEmail,
      invited: true,
      rsvp: normalizedRsvp,
      attendance: normalizedRsvp === 'Confirmed' ? 'Attended' : 'Absent',
      notes: notes || ''
    };
    if (existingGuestIdx >= 0) {
      event.guests[existingGuestIdx] = guestObj;
    } else {
      event.guests.push(guestObj);
    }
    event.rsvp_count = event.guests.filter((g: any) => g.rsvp === 'Confirmed').length;
    saveDb();
    return res.json({ success: true, guest: guestObj, event });
  }

  dbData.rsvpResponses.push({
    eventId,
    guestName,
    guestEmail,
    rsvp: normalizedRsvp,
    notes,
    timestamp: new Date().toISOString()
  });
  saveDb();
  res.json({ success: true });
});

// API: Google Form Webhook / Apps Script endpoint
app.all('/api/gform-webhook', (req, res) => {
  const query = req.query || {};
  const body = req.body || {};

  const eventId = (query.eventId || body.eventId || query.id || body.id || '').toString();
  const guestName = (
    body.name ||
    body.guestName ||
    body['Full Name'] ||
    body['Name'] ||
    body['Pangalan'] ||
    query.name ||
    query.guestName ||
    ''
  ).toString().trim();

  const guestEmail = (
    body.email ||
    body.guestEmail ||
    body['Email Address'] ||
    body['Email'] ||
    query.email ||
    query.guestEmail ||
    ''
  ).toString().trim();

  const rawRsvp = (
    body.rsvp ||
    body.status ||
    body['Will you attend?'] ||
    body['RSVP'] ||
    body['Confirmation'] ||
    body['Attendance'] ||
    body['Response'] ||
    query.rsvp ||
    query.status ||
    ''
  ).toString();

  const notes = (
    body.notes ||
    body.message ||
    body['Notes'] ||
    body['Message'] ||
    query.notes ||
    ''
  ).toString();

  if (!guestName) {
    return res.status(400).json({ error: 'Missing guest name in form submission' });
  }

  const normalizedRsvp = normalizeRsvpStatus(rawRsvp);
  let event = eventId ? dbData.events.find((e: any) => e.id === eventId) : dbData.events[0];

  if (!event) {
    event = {
      id: eventId || 'evt_' + Math.random().toString(36).substring(2, 9),
      title: 'Google Form Event',
      desc: 'Created via Google Form submissions',
      date: new Date().toISOString().slice(0, 10),
      time: '09:00 AM',
      location: 'Venue',
      month_display: 'October 2026',
      day_display: 'Oct\n05',
      max_guests: 50,
      rsvp_count: 0,
      status: 'Upcoming',
      rsvp_link: 'https://forms.gle/aFGNLexpupZkvvpr8',
      guests: []
    };
    dbData.events.push(event);
  }

  if (!Array.isArray(event.guests)) {
    event.guests = [];
  }

  const existingGuestIdx = event.guests.findIndex(
    (g: any) =>
      (guestEmail && g.email.toLowerCase() === guestEmail.toLowerCase()) ||
      g.name.toLowerCase() === guestName.toLowerCase()
  );

  const guestObj = {
    id: existingGuestIdx >= 0 ? event.guests[existingGuestIdx].id : 'g_' + Math.random().toString(36).substring(2, 9),
    name: guestName,
    email: guestEmail || `${guestName.toLowerCase().replace(/\s+/g, '.')}@guest.local`,
    invited: true,
    rsvp: normalizedRsvp,
    attendance: normalizedRsvp === 'Confirmed' ? 'Attended' : 'Absent',
    notes: notes || (existingGuestIdx >= 0 ? event.guests[existingGuestIdx].notes : '')
  };

  if (existingGuestIdx >= 0) {
    event.guests[existingGuestIdx] = guestObj;
  } else {
    event.guests.unshift(guestObj);
  }

  event.rsvp_count = event.guests.filter((g: any) => g.rsvp === 'Confirmed').length;
  saveDb();

  const stats = {
    total: event.guests.length,
    confirmed: event.guests.filter((g: any) => g.rsvp === 'Confirmed').length,
    declined: event.guests.filter((g: any) => g.rsvp === 'Declined').length,
    pending: event.guests.filter((g: any) => g.rsvp === 'Pending').length
  };

  res.json({
    success: true,
    message: `Recorded ${guestName} (${normalizedRsvp}) to guest list`,
    guest: guestObj,
    stats,
    event
  });
});

// API: Update Event RSVP Link
app.post('/api/events/:id/rsvp-link', (req, res) => {
  const { rsvp_link } = req.body;
  const event = dbData.events.find((e: any) => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  event.rsvp_link = rsvp_link || 'https://forms.gle/aFGNLexpupZkvvpr8';
  saveDb();
  res.json({ success: true, event });
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EManage Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
