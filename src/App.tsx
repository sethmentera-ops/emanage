/**
 * EManage - Event RSVP & Attendance Tracker
 * Unified single-file codebase with persistent client database.
 * Landing page is Login / Sign Up by default.
 * Clean slate for new users (events created by user via + Add Event).
 * Fully connected dynamic statistics, ongoing/upcoming sections, calendar dots,
 * and event card guest list with RSVP and attendance tracking.
 * 
 * Features:
 * - 100% functional Copy Link with visual checkmark, clipboard fallback, and copy dialog.
 * - Real, openable RSVP link that works directly in Google Chrome without requiring login.
 * - Dedicated Public Guest RSVP Google Form view when opened via ?rsvp={id}.
 * - Direct "Send via Gmail" and "Send via Mailto" for single guests and all guests at once.
 * - Custom Delete Event confirmation modal.
 * - Guest table with "Email" column header.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ApkDownloadModal } from './ApkDownloadModal';
import {
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  Plus,
  Search,
  Copy,
  Upload,
  Download,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Mail,
  Lock,
  Phone,
  Building,
  Save,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Send,
  ExternalLink,
  AlertTriangle,
  FileText,
  Share2,
  QrCode,
  Smartphone,
  Globe,
  UploadCloud,
  Link as LinkIcon,
  RefreshCw,
  FileSpreadsheet,
  Code2
} from 'lucide-react';


// ==========================================
// 1. DATABASE MODELS & TYPES
// ==========================================

export interface User {
  id: number | string;
  name: string;
  email: string;
  password?: string;
  role: string;
  phone: string;
  organization: string;
  avatar?: string;
  createdAt?: string;
}

export type RSVPStatus = 'Confirmed' | 'Pending' | 'Declined';
export type AttendanceStatus = 'Attended' | 'Absent';
export type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed';

export interface Guest {
  id: string;
  name: string;
  email: string;
  invited: boolean;
  rsvp: RSVPStatus;
  attendance: AttendanceStatus;
  notes?: string;
}

export interface EventItem {
  id: string;
  userId?: string | number;
  title: string;
  desc: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "9:00 am" or "10:15 AM - 12:30 PM"
  location: string;
  month_display: string; // "October 2026"
  day_display: string;   // "Oct\n05"
  max_guests: number;
  rsvp_count: number;
  status: EventStatus;
  rsvp_link: string;
  guests: Guest[];
}

export interface SystemDatabase {
  currentUser: User | null;
  users: User[];
  events: EventItem[];
  notes: string;
}

// ==========================================
// 2. TEMPLATE SEEDS (Jane & Francis Wedding sample)
// ==========================================

export const TEMPLATE_GUESTS_JANE_FRANCIS: Guest[] = [
  { id: 'g1', name: 'Alexander Wright', email: 'alexander.wright@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g2', name: 'Beatrice Miller', email: 'beatrice.m@example.com', invited: false, rsvp: 'Pending', attendance: 'Absent' },
  { id: 'g3', name: 'Carlos Mendez', email: 'carlos.mendez@example.com', invited: true, rsvp: 'Declined', attendance: 'Absent' },
  { id: 'g4', name: 'Diana Prince', email: 'diana.prince@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g5', name: 'Ethan Hawke', email: 'ethan.hawke@example.com', invited: false, rsvp: 'Pending', attendance: 'Attended' },
  { id: 'g6', name: 'Fiona Gallagher', email: 'fiona.g@example.com', invited: true, rsvp: 'Declined', attendance: 'Absent' },
  { id: 'g7', name: 'George Clark', email: 'george.clark@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g8', name: 'Hannah Abbott', email: 'hannah.abbott@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g9', name: 'Ian Malcolm', email: 'ian.malcolm@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g10', name: 'Julia Roberts', email: 'julia.roberts@example.com', invited: true, rsvp: 'Pending', attendance: 'Attended' },
  { id: 'g11', name: 'Kevin Costner', email: 'kevin.costner@example.com', invited: false, rsvp: 'Pending', attendance: 'Attended' },
  { id: 'g12', name: 'Laura Croft', email: 'laura.croft@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g13', name: 'Michael Scott', email: 'michael.scott@example.com', invited: true, rsvp: 'Declined', attendance: 'Absent' },
  { id: 'g14', name: 'Nora Ephron', email: 'nora.e@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g15', name: 'Oliver Twist', email: 'oliver.t@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g16', name: 'Penelope Cruz', email: 'penelope.cruz@example.com', invited: false, rsvp: 'Pending', attendance: 'Attended' },
  { id: 'g17', name: 'Quentin Tarantino', email: 'quentin.t@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g18', name: 'Rachel Green', email: 'rachel.green@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g19', name: 'Steve Rogers', email: 'steve.rogers@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g20', name: 'Tina Fey', email: 'tina.fey@example.com', invited: false, rsvp: 'Pending', attendance: 'Attended' },
  { id: 'g21', name: 'Uma Thurman', email: 'uma.thurman@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g22', name: 'Victor Hugo', email: 'victor.hugo@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g23', name: 'Wanda Maximoff', email: 'wanda.m@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g24', name: 'Xavier Charles', email: 'xavier.c@example.com', invited: false, rsvp: 'Pending', attendance: 'Attended' },
  { id: 'g25', name: 'Yvonne Strahovski', email: 'yvonne.s@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g26', name: 'Zachary Levi', email: 'zachary.l@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g27', name: 'Amelia Earhart', email: 'amelia.e@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g28', name: 'Benjamin Franklin', email: 'benjamin.f@example.com', invited: false, rsvp: 'Pending', attendance: 'Attended' },
  { id: 'g29', name: 'Clara Barton', email: 'clara.b@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g30', name: 'David Beckham', email: 'david.b@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g31', name: 'Emma Watson', email: 'emma.watson@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g32', name: 'Freddie Mercury', email: 'freddie.m@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g33', name: 'Grace Kelly', email: 'grace.kelly@example.com', invited: false, rsvp: 'Pending', attendance: 'Attended' },
  { id: 'g34', name: 'Harry Potter', email: 'harry.p@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g35', name: 'Isla Fisher', email: 'isla.f@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g36', name: 'Jack Sparrow', email: 'jack.sparrow@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g37', name: 'Keira Knightley', email: 'keira.k@example.com', invited: false, rsvp: 'Pending', attendance: 'Attended' },
  { id: 'g38', name: 'Leonardo DiCaprio', email: 'leonardo.d@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g39', name: 'Meryl Streep', email: 'meryl.s@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g40', name: 'Natalie Portman', email: 'natalie.p@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g41', name: 'Oscar Isaac', email: 'oscar.i@example.com', invited: false, rsvp: 'Pending', attendance: 'Attended' },
  { id: 'g42', name: 'Paul Rudd', email: 'paul.rudd@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g43', name: 'Queen Latifah', email: 'queen.l@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g44', name: 'Ryan Gosling', email: 'ryan.g@example.com', invited: false, rsvp: 'Pending', attendance: 'Attended' },
  { id: 'g45', name: 'Scarlett Johansson', email: 'scarlett.j@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g46', name: 'Tom Hanks', email: 'tom.hanks@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g47', name: 'Ursula Corbero', email: 'ursula.c@example.com', invited: false, rsvp: 'Pending', attendance: 'Attended' },
  { id: 'g48', name: 'Vin Diesel', email: 'vin.diesel@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g49', name: 'Will Smith', email: 'will.smith@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' },
  { id: 'g50', name: 'Zoe Saldana', email: 'zoe.saldana@example.com', invited: true, rsvp: 'Confirmed', attendance: 'Attended' }
];

// Public Google Cloud Run Shared App URL (Accessible to anyone on mobile phones or laptops)
export const CLOUD_RUN_SHARED_APP_URL = 'https://ais-pre-i63rshkfl6ghgw43hm4cho-242241923054.asia-east1.run.app';

// Detect the best public base URL reachable by guests on their mobile phones and laptops
export const getBasePublicUrl = () => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // Localhost or 127.0.0.1 is only on the local machine and cannot be opened by a guest's cellphone!
    // Always fallback to the public Cloud Run Shared URL if on localhost:
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return CLOUD_RUN_SHARED_APP_URL;
    }
    // ais-dev- is protected by developer identity; ais-pre- is the public shared URL
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    return origin;
  }
  return CLOUD_RUN_SHARED_APP_URL;
};

// Helper to generate a real, openable web RSVP URL with self-contained event metadata
export const getEventRsvpWebUrl = (eventId: string, eventItem?: Partial<EventItem> | null) => {
  const baseUrl = getBasePublicUrl();
  const searchParams = new URLSearchParams();
  searchParams.set('rsvp', eventId);

  if (eventItem) {
    if (eventItem.title) searchParams.set('title', eventItem.title);
    if (eventItem.date) searchParams.set('date', eventItem.date);
    if (eventItem.time) searchParams.set('time', eventItem.time);
    if (eventItem.location) searchParams.set('loc', eventItem.location);
    if (eventItem.desc) searchParams.set('desc', eventItem.desc);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export interface EventCategoryConfig {
  type: 'wedding' | 'birthday' | 'corporate' | 'general';
  name: string;
  themeColor: string;
  bannerGradient: string;
  tagColor: string;
  icon: string;
  attendanceQuestion: string;
  confirmText: string;
  confirmDesc: string;
  declineText: string;
  declineDesc: string;
  companionLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
}

// Dynamically adapts Google Form content, banner, theme, and questions based on event details
export function getEventCategory(title: string = '', desc: string = ''): EventCategoryConfig {
  const text = `${title} ${desc}`.toLowerCase();
  if (text.includes('wed') || text.includes('kasal') || text.includes('matrimony') || text.includes('nuptial')) {
    return {
      type: 'wedding',
      name: 'Wedding Ceremony & Banquet',
      themeColor: '#7c3aed',
      bannerGradient: 'from-purple-800 via-pink-700 to-rose-600',
      tagColor: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: '💍',
      attendanceQuestion: 'Will you celebrate our holy matrimony and banquet with us?',
      confirmText: 'Yes, I will attend with joy (Confirm)',
      confirmDesc: 'I will be there to witness your vows and celebrate!',
      declineText: 'Regretfully decline',
      declineDesc: 'Unable to attend on this special day, but sending warm congratulations.',
      companionLabel: 'Number of Plus-Ones / Family Members Attending with You',
      notesLabel: 'Message of congratulations or special wishes for the newlywed couple',
      notesPlaceholder: 'Write a heartfelt wish or message for the bride and groom...'
    };
  }
  if (text.includes('birth') || text.includes('kaarawan') || text.includes('bday') || text.includes('debut') || text.includes('party')) {
    return {
      type: 'birthday',
      name: 'Birthday Party & Celebration',
      themeColor: '#db2777',
      bannerGradient: 'from-pink-600 via-purple-600 to-indigo-600',
      tagColor: 'bg-pink-100 text-pink-800 border-pink-200',
      icon: '🎂',
      attendanceQuestion: 'Are you coming to celebrate this special birthday milestone with us?',
      confirmText: 'Yes, count me in for the party! (Confirm)',
      confirmDesc: 'Excited to celebrate, eat cake, and have fun!',
      declineText: 'Sorry, cannot make it (Decline)',
      declineDesc: 'Wishing you the happiest birthday even though I cannot attend.',
      companionLabel: 'Number of Companions / Kids Attending with You',
      notesLabel: 'Birthday message, song dedication, or gift note',
      notesPlaceholder: 'Leave a fun birthday greeting or song request...'
    };
  }
  if (text.includes('conference') || text.includes('seminar') || text.includes('summit') || text.includes('training') || text.includes('workshop') || text.includes('corporate') || text.includes('meeting')) {
    return {
      type: 'corporate',
      name: 'Conference & Professional Seminar',
      themeColor: '#1d4ed8',
      bannerGradient: 'from-blue-800 via-indigo-700 to-slate-900',
      tagColor: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '💼',
      attendanceQuestion: 'Will you be attending the keynote & session proceedings?',
      confirmText: 'Confirm delegate attendance (Confirm)',
      confirmDesc: 'My attendance is confirmed for the scheduled sessions.',
      declineText: 'Unable to attend / Send representative',
      declineDesc: 'Cannot attend this conference schedule.',
      companionLabel: 'Number of Colleagues / Delegates Attending with You',
      notesLabel: 'Organization / Company Name & Dietary Preferences for Meals',
      notesPlaceholder: 'e.g. Acme Corp / Vegetarian lunch preferred'
    };
  }
  return {
    type: 'general',
    name: 'Event Celebration & Gathering',
    themeColor: '#0b1957',
    bannerGradient: 'from-[#0b1957] via-indigo-800 to-purple-900',
    tagColor: 'bg-indigo-100 text-[#0b1957] border-indigo-200',
    icon: '🎉',
    attendanceQuestion: 'Will you be attending this upcoming event?',
    confirmText: 'Yes, I will attend (Confirm)',
    confirmDesc: 'Looking forward to participating in this gathering!',
    declineText: 'No, I cannot attend (Decline)',
    declineDesc: 'Will not be able to join on this date.',
    companionLabel: 'Number of Companions / Guests with You',
    notesLabel: 'Special notes or message for the organizer',
    notesPlaceholder: 'Write any questions or notes for the organizer...'
  };
}

// Default Google Form RSVP Link for wedding template
export const DEFAULT_GFORM_RSVP_URL = 'https://forms.gle/aFGNLexpupZkvvpr8';

export const DEMO_SAMPLE_EVENT: EventItem = {
  id: 'evt-wedding-sample',
  title: 'Jane & Francis Wedding',
  desc: 'Grand holy matrimony and banquet celebration at Tagaytay Ridge.',
  date: '2026-10-05',
  time: '9:00 am',
  location: 'Tagaytay',
  month_display: 'October 2026',
  day_display: 'Oct\n05',
  max_guests: 50,
  rsvp_count: 30,
  status: 'Upcoming',
  rsvp_link: DEFAULT_GFORM_RSVP_URL,
  guests: TEMPLATE_GUESTS_JANE_FRANCIS
};

const DEFAULT_EMPTY_USER: User = {
  id: 'guest',
  name: 'User',
  email: '',
  password: '',
  role: 'Event Host & Admin',
  phone: '',
  organization: 'Personal Workspace',
  createdAt: ''
};

const INITIAL_NOTES = `• Prepare attendance list\n• Confirm event venue\n• Contact participants`;

// Storage Keys
// Save / update an account on the server so it survives logout, cleared browser data, and other devices
const saveUserToServer = (user: User) => {
  if (!user || !user.email || !user.password) return;
  fetch('/api/users/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  }).catch(() => {});
};

const DB_STORAGE_KEY = 'emanage_system_database_v5';

// Helpers for Gmail and Email links
export const createGmailComposeUrl = (toEmails: string[], subject: string, body: string) => {
  const base = 'https://mail.google.com/mail/?view=cm&fs=1';
  const to = encodeURIComponent(toEmails.join(','));
  const su = encodeURIComponent(subject);
  const b = encodeURIComponent(body);
  return `${base}&to=${to}&su=${su}&body=${b}`;
};

export const createMailtoUrl = (toEmails: string[], subject: string, body: string) => {
  const to = toEmails.join(',');
  const su = encodeURIComponent(subject);
  const b = encodeURIComponent(body);
  return `mailto:${to}?subject=${su}&body=${b}`;
};

// ==========================================
// 3. MAIN APPLICATION COMPONENT
// ==========================================

export default function App() {
  // Check if a guest opened a public RSVP link (e.g. ?rsvp=evt_123 in Google Chrome)
  // Parse public RSVP parameters from URL query string (?rsvp=...&title=...&date=... etc.)
  const urlRsvpParams = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const rsvp = params.get('rsvp') || params.get('rsvp_event');
      if (rsvp) {
        return {
          id: rsvp,
          title: params.get('title') || '',
          date: params.get('date') || '',
          time: params.get('time') || '',
          location: params.get('loc') || params.get('location') || '',
          desc: params.get('desc') || ''
        };
      }
    }
    return null;
  }, []);

  const [publicRsvpEventId, setPublicRsvpEventId] = useState<string | null>(urlRsvpParams?.id || null);

  // Force purge legacy demo account from any old localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DB_STORAGE_KEY);
      if (saved && (saved.includes('jheanroseg') || saved.includes('arigatoujinrus'))) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.users)) {
          parsed.users = parsed.users.filter((u: any) => u.email !== 'jheanroseg@gmail.com' && u.name !== 'Jhean');
        }
        if (parsed.currentUser && parsed.currentUser.email === 'jheanroseg@gmail.com') {
          parsed.currentUser = null;
        }
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(parsed));
        setDb(parsed);
      }
    } catch (_) {}
  }, []);

  // Database state: Start with clean slate (empty events) by default
  const [db, setDb] = useState<SystemDatabase>(() => {
    try {
      const saved = localStorage.getItem(DB_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleanedUsers = Array.isArray(parsed.users)
          ? parsed.users.filter((u: User) => u.email !== 'jheanroseg@gmail.com' && u.name !== 'Jhean')
          : [];
        const cleanedCurrentUser = (parsed.currentUser && parsed.currentUser.email !== 'jheanroseg@gmail.com')
          ? parsed.currentUser
          : null;
        return {
          ...parsed,
          currentUser: cleanedCurrentUser,
          users: cleanedUsers,
          events: parsed.events || [],
          notes: parsed.notes || INITIAL_NOTES
        };
      }
    } catch (e) {
      console.error('Failed to parse database from localStorage', e);
    }
    return {
      currentUser: null,
      users: [], // Zero demo accounts! Saved only when users sign up
      events: [],
      notes: INITIAL_NOTES
    };
  });

  // Persist DB changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to persist db', e);
    }
  }, [db]);

  // Sync with backend Express server (keeps organizer laptop, mobile phones, and guests in real-time sync)
  useEffect(() => {
    // 0. Push any locally saved accounts (with passwords) to the server if it doesn't have them yet
    try {
      const saved = localStorage.getItem(DB_STORAGE_KEY);
      const localUsers = saved ? (JSON.parse(saved).users || []) : [];
      if (Array.isArray(localUsers) && localUsers.length > 0) {
        fetch('/api/users/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: localUsers })
        }).catch(() => {});
      }
    } catch (_) {}

    // 1. Initial fetch from server
    fetch('/api/users')
      .then(res => (res.ok ? res.json() : []))
      .then((serverUsers: User[]) => {
        if (Array.isArray(serverUsers) && serverUsers.length > 0) {
          setDb(prev => {
            const merged = [...prev.users];
            for (const su of serverUsers) {
              if (su.email === 'jheanroseg@gmail.com') continue;
              const idx = merged.findIndex(u => u.email.toLowerCase() === su.email.toLowerCase());
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...su };
              } else {
                merged.push(su);
              }
            }
            return { ...prev, users: merged };
          });
        }
      })
      .catch(() => {});

    fetch('/api/events')
      .then(res => (res.ok ? res.json() : []))
      .then((serverEvents: EventItem[]) => {
        if (Array.isArray(serverEvents) && serverEvents.length > 0) {
          setDb(prev => {
            const merged = [...prev.events];
            for (const sev of serverEvents) {
              const idx = merged.findIndex(e => e.id === sev.id);
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...sev };
              } else {
                merged.push(sev);
              }
            }
            return { ...prev, events: merged };
          });
        }
      })
      .catch(() => {});

    // 2. Poll server every 5 seconds to capture RSVPs submitted by guests from their cellphones
    const interval = setInterval(() => {
      fetch('/api/events')
        .then(res => (res.ok ? res.json() : []))
        .then((serverEvents: EventItem[]) => {
          if (Array.isArray(serverEvents) && serverEvents.length > 0) {
            setDb(prev => {
              let changed = false;
              const merged = prev.events.map(localEv => {
                const sev = serverEvents.find(s => s.id === localEv.id);
                if (sev && JSON.stringify(sev.guests) !== JSON.stringify(localEv.guests)) {
                  changed = true;
                  return { ...localEv, guests: sev.guests, rsvp_count: sev.rsvp_count };
                }
                return localEv;
              });
              return changed ? { ...prev, events: merged } : prev;
            });
          }
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Sync organizer local events to server whenever created or updated
  useEffect(() => {
    if (db.events.length > 0) {
      fetch('/api/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: db.events })
      }).catch(() => {});
    }
  }, [db.events]);

  // Session State: Landing page is ALWAYS Login / Sign Up by default!
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Current active page view: 'Dashboard' | 'Events' | 'EventDetail' | 'Profile'
  const [activePage, setActivePage] = useState<'Dashboard' | 'Events' | 'EventDetail' | 'Profile'>('Dashboard');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Auth View: 'login' | 'signup' | 'forgot' | 'verify' | 'newpass'
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot' | 'verify' | 'newpass'>('login');

  // Modals for Google Form RSVP, Broadcast Email, Delete Confirmation, and QR / Mobile Test Modal
  const [rsvpFormEvent, setRsvpFormEvent] = useState<EventItem | null>(null);
  const [broadcastEvent, setBroadcastEvent] = useState<EventItem | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);
  const [linkModalUrl, setLinkModalUrl] = useState<string | null>(null);
  const [qrModalEvent, setQrModalEvent] = useState<EventItem | null>(null);

  // Unli Pop-up for Install / Download App (automatically pops up every time link is opened)
  const [showApkDownloadModal, setShowApkDownloadModal] = useState<boolean>(true);

  // Facebook-style Log Out confirmation modal state
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  // APK & Render / GitHub deployment modal state
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  // Listen for native PWA installation event (WebAPK)
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredInstallPrompt(null);
    });
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('Installing EManage app on your device!');
        }
        setDeferredInstallPrompt(null);
      } catch (err) {
        
      }
    } else {
      
    }
  };

  // Toast notification system
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Calendar date state for dashboard
  const [calDate, setCalDate] = useState<Date>(new Date(2026, 9, 1)); // October 2026

  // Event modal states
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Notes state
  const [notesText, setNotesText] = useState<string>(db.notes);
  useEffect(() => {
    setNotesText(db.notes);
  }, [db.notes]);

  // Handle Logout -> Redirects to landing page (Login)
  const handleLogout = () => {
    setIsAuthenticated(false);
    setDb(prev => ({ ...prev, currentUser: null }));
    setAuthView('login');
    showToast('Logged out successfully.');
  };


  // Handle Login Success
  const handleLoginSuccess = (user: User) => {
    setDb(prev => ({ ...prev, currentUser: user }));
    setIsAuthenticated(true);
    setActivePage('Dashboard');
    showToast(`Welcome back, ${user.name}!`);
  };

  // Selected event accessor
  const currentEvent = useMemo(() => {
    if (!selectedEventId) return db.events[0] || null;
    return db.events.find(e => e.id === selectedEventId) || db.events[0] || null;
  }, [db.events, selectedEventId]);

  // Database mutations
  const updateGuestsInEvent = (eventId: string, newGuests: Guest[]) => {
    setDb(prev => {
      const updatedEvents = prev.events.map(ev => {
        if (ev.id === eventId) {
          const confirmedCount = newGuests.filter(g => g.rsvp === 'Confirmed').length;
          return {
            ...ev,
            guests: newGuests,
            rsvp_count: confirmedCount
          };
        }
        return ev;
      });
      return { ...prev, events: updatedEvents };
    });
  };

  const deleteGuest = (eventId: string, guestId: string) => {
    if (!currentEvent) return;
    const newGuests = currentEvent.guests.filter(g => g.id !== guestId);
    updateGuestsInEvent(eventId, newGuests);
    showToast('Guest removed from list.');
  };

  const addGuest = (eventId: string, guest: Omit<Guest, 'id'>) => {
    const newGuest: Guest = {
      ...guest,
      id: 'g_' + Math.random().toString(36).substring(2, 9)
    };
    const target = db.events.find(e => e.id === eventId);
    const existing = target ? target.guests : [];
    const newGuests = [newGuest, ...existing];
    updateGuestsInEvent(eventId, newGuests);
    showToast(`Guest "${newGuest.name}" added!`);
  };

  // Reliable delete event handler with custom modal confirmation
  const confirmDeleteEvent = (event: EventItem) => {
    setEventToDelete(event);
  };

  const executeDeleteEvent = () => {
    if (!eventToDelete) return;
    const id = eventToDelete.id;
    const title = eventToDelete.title;
    setDb(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== id)
    }));
    setEventToDelete(null);
    showToast(`Event "${title}" has been deleted.`);
    if (activePage === 'EventDetail' && selectedEventId === id) {
      setActivePage('Events');
      setSelectedEventId(null);
    }
  };

  // Save / Create Event with automatic Google Form RSVP link generation
  const saveEventItem = (eventData: Partial<EventItem> & { title: string; date: string; time: string; max_guests: number }) => {
    const dateObj = new Date(eventData.date + 'T00:00:00');
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthShorts = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month_display = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    const day_display = `${monthShorts[dateObj.getMonth()]}\n${String(dateObj.getDate()).padStart(2, '0')}`;

    if (editingEvent) {
      // Edit mode
      setDb(prev => ({
        ...prev,
        events: prev.events.map(ev => {
          if (ev.id === editingEvent.id) {
            return {
              ...ev,
              ...eventData,
              month_display,
              day_display
            };
          }
          return ev;
        })
      }));
      setEditingEvent(null);
      showToast('Event updated successfully!');
    } else {
      // Create mode: prioritize uploaded/provided RSVP link or default Google Form RSVP Link
      const newId = 'evt_' + Math.random().toString(36).substring(2, 9);
      const googleFormRsvpLink = (eventData.rsvp_link && eventData.rsvp_link.trim().length > 0)
        ? eventData.rsvp_link.trim()
        : DEFAULT_GFORM_RSVP_URL;

      const newEvent: EventItem = {
        id: newId,
        userId: db.currentUser?.id,
        title: eventData.title,
        desc: eventData.desc || 'No description provided',
        date: eventData.date,
        time: eventData.time,
        location: eventData.location || 'Main Venue',
        month_display,
        day_display,
        max_guests: Number(eventData.max_guests) || 50,
        rsvp_count: 0,
        status: (eventData.status as EventStatus) || 'Upcoming',
        rsvp_link: googleFormRsvpLink,
        guests: []
      };

      setDb(prev => ({
        ...prev,
        events: [newEvent, ...prev.events]
      }));
      setShowAddEventModal(false);
      setSelectedEventId(newId);
      showToast(`Event "${newEvent.title}" created with RSVP link!`);
    }
  };

  // Rock-solid Copy Link function with dual fallback & visual feedback
  const handleCopyLink = async (url: string, key?: string) => {
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        success = true;
      }
    } catch (e) {
      console.warn('Clipboard writeText failed, using fallback', e);
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error('execCommand copy failed', err);
      }
    }

    if (key) {
      setCopiedLinkKey(key);
      setTimeout(() => setCopiedLinkKey(null), 2500);
    }

    if (success) {
      showToast('✅ RSVP link copied to clipboard! Ready to open in Google Chrome or paste into Gmail.');
    } else {
      setLinkModalUrl(url);
    }
  };

  // Export guests to CSV
  const exportGuestsCSV = (eventName: string, guests: Guest[]) => {
    const headers = ['Name', 'Email', 'Invited', 'RSVP', 'Attendance'];
    const rows = guests.map(g => [
      `"${g.name.replace(/"/g, '""')}"`,
      `"${g.email.replace(/"/g, '""')}"`,
      g.invited ? 'Yes' : 'No',
      g.rsvp,
      g.attendance
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${eventName.replace(/\s+/g, '_')}_Guest_List.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Guest list exported to CSV!');
  };

  // Helper to load sample wedding event if user wants template
  const handleLoadSampleEvent = () => {
    const exists = db.events.some(e => e.title === DEMO_SAMPLE_EVENT.title);
    if (exists) {
      showToast('Sample event already loaded in your events.');
      return;
    }
    const sampleWithRealUrl = {
      ...DEMO_SAMPLE_EVENT,
      rsvp_link: DEMO_SAMPLE_EVENT.rsvp_link || DEFAULT_GFORM_RSVP_URL
    };
    setDb(prev => ({
      ...prev,
      events: [sampleWithRealUrl, ...prev.events]
    }));
    setSelectedEventId(DEMO_SAMPLE_EVENT.id);
    showToast('Loaded Jane & Francis Wedding template with 50 guests!');
  };

  // Clear all events for a fresh start
  const handleClearAllEvents = () => {
    setDb(prev => ({ ...prev, events: [] }));
    setSelectedEventId(null);
    showToast('All events cleared. Clean slate ready!');
  };

  // Export full JSON database
  const handleExportDbJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `EManage_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Full database JSON exported!');
  };

  // ------------------------------------------
  // PUBLIC GUEST RSVP PAGE (When opened via ?rsvp=... in Chrome)
  // ------------------------------------------
  if (publicRsvpEventId) {
    // 1. Look in db.events
    let targetEvent = db.events.find(e => e.id === publicRsvpEventId) || (publicRsvpEventId === 'evt-wedding-sample' ? DEMO_SAMPLE_EVENT : null);

    // 2. If not found in organizer's local storage (e.g. guest opened on cellphone/laptop), reconstruct from URL parameters
    if (!targetEvent && urlRsvpParams) {
      targetEvent = {
        id: publicRsvpEventId,
        title: urlRsvpParams.title || 'Event RSVP Confirmation',
        desc: urlRsvpParams.desc || 'Please confirm your attendance for this upcoming celebration.',
        date: urlRsvpParams.date || 'Upcoming Date',
        time: urlRsvpParams.time || '9:00 am',
        location: urlRsvpParams.location || 'Event Venue',
        month_display: '',
        day_display: '',
        max_guests: 50,
        rsvp_count: 0,
        status: 'Upcoming',
        rsvp_link: getEventRsvpWebUrl(publicRsvpEventId, urlRsvpParams),
        guests: []
      };
    }

    return (
      <PublicGuestRsvpPage
        event={targetEvent}
        eventId={publicRsvpEventId}
        onRsvpSubmitted={(name, email, choice, notes) => {
          // Send to backend server so organizer laptop immediately gets it!
          fetch('/api/rsvp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: publicRsvpEventId,
              guestName: name,
              guestEmail: email,
              rsvp: choice,
              notes,
              eventDetails: targetEvent
            })
          }).catch(console.error);

          if (targetEvent) {
            const existing = [...targetEvent.guests];
            const matchIndex = existing.findIndex(
              g => g.email.toLowerCase() === email.toLowerCase() || g.name.toLowerCase() === name.toLowerCase()
            );

            if (matchIndex >= 0) {
              existing[matchIndex] = {
                ...existing[matchIndex],
                name,
                email,
                rsvp: choice,
                attendance: choice === 'Confirmed' ? 'Attended' : 'Absent',
                notes: notes || existing[matchIndex].notes
              };
            } else {
              existing.push({
                id: 'g_' + Math.random().toString(36).substring(2, 9),
                name,
                email,
                invited: true,
                rsvp: choice,
                attendance: choice === 'Confirmed' ? 'Attended' : 'Absent',
                notes
              });
            }

            updateGuestsInEvent(targetEvent.id, existing);
          }
        }}
        onExitToOrganizer={() => {
          // Remove query param and return to organizer login/dashboard
          window.history.pushState({}, '', window.location.pathname);
          setPublicRsvpEventId(null);
        }}
      />
    );
  }

  // ------------------------------------------
  // LANDING PAGE: AUTHENTICATION SCREEN (DEFAULT)
  // ------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fffdf6] flex flex-col justify-center items-center p-4 font-sans select-none">
        {toastMessage && (
          <div className="fixed top-6 z-50 bg-[#0b1957] text-[#f7f4ed] px-5 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-300" />
            {toastMessage}
          </div>
        )}

        <div className="w-full max-w-[480px] bg-[#f7f4ed] border border-[#eee5d6] rounded-[28px] p-8 shadow-sm">
          {/* Logo Brand */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#0b1957] text-white flex items-center justify-center font-serif font-black text-xl shadow">
              EM
            </div>
            <span className="text-2xl font-serif font-bold text-[#0b1957] tracking-wide">
              EManage
            </span>
          </div>

          <p className="text-xs text-center text-[#5a5a55] mb-6">
            Event RSVP &amp; Attendance Tracker System
          </p>

          {/* Toggle Tabs for Login & Sign Up */}
          {(authView === 'login' || authView === 'signup') && (
            <div className="flex bg-[#e8e4d8] p-1 rounded-full mb-6">
              <button
                type="button"
                onClick={() => setAuthView('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  authView === 'login'
                    ? 'bg-[#0b1957] text-white shadow-sm'
                    : 'text-[#0b1957] hover:text-black'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setAuthView('signup')}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  authView === 'signup'
                    ? 'bg-[#0b1957] text-white shadow-sm'
                    : 'text-[#0b1957] hover:text-black'
                }`}
              >
                Sign Up (New Users)
              </button>
            </div>
          )}

          {authView === 'login' && (
            <LoginForm
              onLogin={handleLoginSuccess}
              onNavigate={setAuthView}
              registeredUsers={db.users}
            />
          )}

          {authView === 'signup' && (
            <SignupForm
              onSignup={newUser => {
                saveUserToServer(newUser);
                setDb(prev => ({
                  ...prev,
                  users: [...prev.users, newUser],
                  currentUser: newUser,
                  events: [] // New user starts with clean slate 0 events!
                }));
                setIsAuthenticated(true);
                setActivePage('Dashboard');
                showToast(`Account created! Welcome, ${newUser.name}!`);
              }}
              onNavigate={setAuthView}
            />
          )}

          {authView === 'forgot' && (
            <ForgotPasswordForm
              onNavigate={setAuthView}
              onCodeSent={() => {
                showToast('Verification code sent to your email.');
                setAuthView('verify');
              }}
            />
          )}

          {authView === 'verify' && (
            <VerifyEmailForm
              onNavigate={setAuthView}
              onVerified={() => {
                showToast('Email verified successfully!');
                setAuthView('newpass');
              }}
            />
          )}

          {authView === 'newpass' && (
            <CreateNewPasswordForm
              onNavigate={setAuthView}
              onSaved={(newPassword) => {
                db.users.forEach(u => saveUserToServer({ ...u, password: newPassword }));
                setDb(prev => ({
                  ...prev,
                  users: prev.users.map(u => ({ ...u, password: newPassword }))
                }));
                showToast('Password updated! Please login with your new password.');
                setAuthView('login');
              }}
            />
          )}
        </div>

        {/* Persistent Download / Install APK Button on Landing Screen */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setShowApkDownloadModal(true)}
            className="inline-flex items-center gap-2 bg-[#0b1957] hover:bg-[#101d6b] text-white py-2.5 px-5 rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer border border-[#101d6b]"
          >
            <Smartphone className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>📱 I-download / I-install ang EManage APK</span>
          </button>
        </div>

        {/* UNLI POP-UP: INSTALL / DOWNLOAD APK WITH CONNECTION-AWARE ANIMATED EFFECT */}
        <ApkDownloadModal
          isOpen={showApkDownloadModal}
          onClose={() => setShowApkDownloadModal(false)}
          deferredInstallPrompt={deferredInstallPrompt}
          onToast={showToast}
        />
      </div>
    );
  }

  // ------------------------------------------
  // MAIN APP SHELL: DASHBOARD, EVENTS, EVENT CARD, PROFILE
  // ------------------------------------------
  const activeUser = db.currentUser || DEFAULT_EMPTY_USER;

  return (
    <div className="min-h-screen bg-[#faf8f2] flex flex-row font-sans text-gray-800 antialiased overflow-x-hidden">
      {/* Toast Popup */}
      {toastMessage && (
        <div className="fixed top-5 right-6 z-50 bg-[#0b1957] text-[#f7f4ed] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 border border-blue-900 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* LEFT SIDEBAR (Strictly styled according to dashboard.py) */}
      <aside className="w-[200px] shrink-0 min-h-screen bg-[#ffffe3] border-r border-[#eee5d6] flex flex-col justify-between py-5 px-3 select-none">
        <div>
          {/* Header & Logo */}
          <div className="flex items-center gap-3 px-3 py-2 mb-8 cursor-pointer" onClick={() => setActivePage('Dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-[#0b1957] text-[#f7f4ed] flex items-center justify-center font-serif font-bold text-lg shadow-sm">
              EM
            </div>
            <span className="font-serif font-bold text-[#0b1957] text-lg tracking-wide">
              EManage
            </span>
          </div>

          {/* Navigation Menu Rows */}
          <nav className="flex flex-col gap-2">
            {/* Dashboard */}
            <button
              onClick={() => setActivePage('Dashboard')}
              className={`w-full h-11 px-3 rounded-lg flex items-center gap-3 text-left transition-colors font-medium text-sm cursor-pointer ${
                activePage === 'Dashboard'
                  ? 'bg-[#0b1957] text-[#f7f4ed]'
                  : 'text-[#0b1957] hover:bg-[#101d6b] hover:text-[#f7f4ed]'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span>Dashboard</span>
            </button>

            {/* Events */}
            <button
              onClick={() => setActivePage('Events')}
              className={`w-full h-11 px-3 rounded-lg flex items-center gap-3 text-left transition-colors font-medium text-sm cursor-pointer ${
                activePage === 'Events' || activePage === 'EventDetail'
                  ? 'bg-[#0b1957] text-[#f7f4ed]'
                  : 'text-[#0b1957] hover:bg-[#101d6b] hover:text-[#f7f4ed]'
              }`}
            >
              <CalendarDays className="w-5 h-5 shrink-0" />
              <span>Events</span>
            </button>
            {/* Profile */}
            <button
              onClick={() => setActivePage('Profile')}
              className={`w-full h-11 px-3 rounded-lg flex items-center gap-3 text-left transition-colors font-medium text-sm cursor-pointer ${
                activePage === 'Profile'
                  ? 'bg-[#0b1957] text-[#f7f4ed]'
                  : 'text-[#0b1957] hover:bg-[#101d6b] hover:text-[#f7f4ed]'
              }`}
            >
              <UserIcon className="w-5 h-5 shrink-0" />
              <span>Profile</span>
            </button>

            {/* Logout (with Facebook-style confirmation popup) */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full h-11 px-3 rounded-lg flex items-center gap-3 text-left text-[#0b1957] hover:bg-rose-900 hover:text-white transition-colors font-medium text-sm cursor-pointer"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span>Logout</span>
            </button>
          </nav>
        </div>

        {/* User Mini Bar at bottom of sidebar */}
        <div className="pt-4 border-t border-[#eee5d6] px-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0b1957] text-white flex items-center justify-center font-bold text-xs uppercase">
            {activeUser.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-[#0b1957] truncate">{activeUser.name}</div>
            <div className="text-[10px] text-gray-500 truncate">{activeUser.email}</div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW CONTENT AREA */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        {activePage === 'Dashboard' && (
          <DashboardPage
            db={db}
            currentUser={activeUser}
            onOpenEvent={(id) => {
              setSelectedEventId(id);
              setActivePage('EventDetail');
            }}
            onNavigateToEvents={() => setActivePage('Events')}
            onOpenAddEvent={() => {
              setEditingEvent(null);
              setShowAddEventModal(true);
            }}
            onLoadSampleEvent={handleLoadSampleEvent}
            calDate={calDate}
            setCalDate={setCalDate}
            notesText={notesText}
            setNotesText={setNotesText}
            onSaveNotes={() => {
              setDb(prev => ({ ...prev, notes: notesText }));
              showToast('📝 Your notes have been saved!');
            }}
          />
        )}

        {activePage === 'Events' && (
          <EventsListPage
            events={db.events}
            onOpenEvent={(id) => {
              setSelectedEventId(id);
              setActivePage('EventDetail');
            }}
            onAddEvent={() => {
              setEditingEvent(null);
              setShowAddEventModal(true);
            }}
            onEditEvent={(event) => {
              setEditingEvent(event);
              setShowAddEventModal(true);
            }}
            onDeleteEvent={confirmDeleteEvent}
            onCopyLink={(url, key) => handleCopyLink(url, key)}
            copiedKey={copiedLinkKey}
            onOpenRsvpForm={(event) => setRsvpFormEvent(event)}
            onExportCSV={exportGuestsCSV}
            onLoadSampleEvent={handleLoadSampleEvent}
          />
        )}

        {activePage === 'EventDetail' && currentEvent && (
          <EventDetailPage
            event={currentEvent}
            onBack={() => setActivePage('Events')}
            onUpdateGuests={(newGuests) => updateGuestsInEvent(currentEvent.id, newGuests)}
            onDeleteGuest={(guestId) => deleteGuest(currentEvent.id, guestId)}
            onAddGuest={(guest) => addGuest(currentEvent.id, guest)}
            onCopyLink={(url) => handleCopyLink(url, 'header_' + currentEvent.id)}
            isCopied={copiedLinkKey === 'header_' + currentEvent.id}
            onOpenRsvpForm={() => setRsvpFormEvent(currentEvent)}
            onOpenBroadcast={() => setBroadcastEvent(currentEvent)}
            onExportCSV={() => exportGuestsCSV(currentEvent.title, currentEvent.guests)}
            onLoadSampleGuests={() => {
              updateGuestsInEvent(currentEvent.id, TEMPLATE_GUESTS_JANE_FRANCIS);
              showToast('Loaded 50 sample guests into this event!');
            }}
            onUpdateEvent={(updated) => {
              setDb(prev => ({
                ...prev,
                events: prev.events.map(ev => (ev.id === currentEvent.id ? { ...ev, ...updated } : ev))
              }));
              if (updated.rsvp_link) {
                fetch(`/api/events/${currentEvent.id}/rsvp-link`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ rsvp_link: updated.rsvp_link })
                }).catch(console.error);
              }
            }}
            showToast={showToast}
          />
        )}
        {activePage === 'Profile' && (
          <ProfilePage
            user={activeUser}
            eventsCount={db.events.length}
            totalGuestsCount={db.events.reduce((acc, ev) => acc + ev.guests.length, 0)}
            onSaveUser={(updatedUser) => {
              saveUserToServer(updatedUser);
              setDb(prev => ({
                ...prev,
                currentUser: updatedUser,
                users: prev.users.map(u => u.email === updatedUser.email ? updatedUser : u)
              }));
              showToast('Profile updated successfully!');
            }}
            onClearAllEvents={handleClearAllEvents}
            onLoadSampleEvent={handleLoadSampleEvent}
            onExportJson={handleExportDbJson}
            onLogout={() => setShowLogoutModal(true)}
          />
        )}
      </main>

      {/* CREATE / EDIT EVENT MODAL */}
      {showAddEventModal && (
        <EventFormModal
          initialData={editingEvent}
          onClose={() => {
            setShowAddEventModal(false);
            setEditingEvent(null);
          }}
          onSave={saveEventItem}
        />
      )}

      {/* CUSTOM EVENT DELETE CONFIRMATION MODAL */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-1">Delete Event?</h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-800">"{eventToDelete.title}"</strong>? This will permanently delete the event, its guest list, and attendance records.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteEvent}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COPY LINK PROMPT MODAL (If browser clipboard permission is blocked) */}
      {linkModalUrl && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <h3 className="font-bold text-sm text-[#0b1957]">Copy RSVP Link</h3>
              <button onClick={() => setLinkModalUrl(null)} className="text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Select and copy the link below to open directly in Google Chrome or share with your guests:
            </p>
            <input
              type="text"
              readOnly
              value={linkModalUrl}
              onClick={(e) => e.currentTarget.select()}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs font-mono text-[#0b1957] mb-4 select-all"
            />
            <div className="flex justify-end gap-2">
              <a
                href={linkModalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-purple-50 text-purple-800 text-xs font-semibold hover:bg-purple-100 flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test in Chrome</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(linkModalUrl);
                  setLinkModalUrl(null);
                  showToast('Link copied!');
                }}
                className="bg-[#0b1957] hover:bg-[#101d6b] text-white text-xs px-4 py-2 rounded-lg font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE FORM RSVP CONFIRMATION MODAL (Functional & Connected to Guest List) */}
      {rsvpFormEvent && (
        <GoogleFormRsvpModal
          event={rsvpFormEvent}
          onClose={() => setRsvpFormEvent(null)}
          onRsvpSubmitted={(guestName, guestEmail, rsvpStatus, notes) => {
            const existingGuests = [...rsvpFormEvent.guests];
            const matchIndex = existingGuests.findIndex(
              g => g.email.toLowerCase() === guestEmail.toLowerCase() || g.name.toLowerCase() === guestName.toLowerCase()
            );

            if (matchIndex >= 0) {
              existingGuests[matchIndex] = {
                ...existingGuests[matchIndex],
                name: guestName,
                email: guestEmail,
                rsvp: rsvpStatus,
                attendance: rsvpStatus === 'Confirmed' ? 'Attended' : 'Absent',
                notes: notes || existingGuests[matchIndex].notes
              };
            } else {
              existingGuests.push({
                id: 'g_' + Math.random().toString(36).substring(2, 9),
                name: guestName,
                email: guestEmail,
                invited: true,
                rsvp: rsvpStatus,
                attendance: rsvpStatus === 'Confirmed' ? 'Attended' : 'Absent',
                notes
              });
            }

            updateGuestsInEvent(rsvpFormEvent.id, existingGuests);
            showToast(`RSVP response received from ${guestName}: ${rsvpStatus}!`);
          }}
        />
      )}

      {/* BROADCAST RSVP LINK TO ALL GUEST EMAILS & GMAIL MODAL */}
      {broadcastEvent && (
        <BroadcastEmailsModal
          event={db.events.find(e => e.id === broadcastEvent.id) || broadcastEvent}
          onClose={() => setBroadcastEvent(null)}
          onBroadcastComplete={() => {
            const currentBroadcastEv = db.events.find(e => e.id === broadcastEvent.id) || broadcastEvent;
            const updated = currentBroadcastEv.guests.map(g => ({ ...g, invited: true }));
            updateGuestsInEvent(broadcastEvent.id, updated);
            setBroadcastEvent(null);
            showToast(`✉️ RSVP link successfully sent to all ${currentBroadcastEv.guests.length} guest emails!`);
          }}
        />
      )}

      {/* UNLI POP-UP: INSTALL / DOWNLOAD APK WITH CONNECTION-AWARE ANIMATED EFFECT */}
      <ApkDownloadModal
        isOpen={showApkDownloadModal}
        onClose={() => setShowApkDownloadModal(false)}
        deferredInstallPrompt={deferredInstallPrompt}
        onToast={showToast}
      />

      {/* FACEBOOK-STYLE LOG OUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in select-none"
          onClick={() => setShowLogoutModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Facebook/App Style Logout Icon */}
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3.5 border border-rose-100 shadow-2xs">
              <LogOut className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-1.5 font-sans">
              Log out of your account?
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to log out? Do you want to continue to log out? You will need to enter your credentials again to manage your events and guest lists.
            </p>
            <div className="flex gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0b1957] hover:bg-[#101d6b] text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

// ==========================================
// 4. DASHBOARD PAGE (Dynamic & Connected)
// ==========================================

function DashboardPage({
  db,
  currentUser,
  onOpenEvent,
  onNavigateToEvents,
  onOpenAddEvent,
  onLoadSampleEvent,
  calDate,
  setCalDate,
  notesText,
  setNotesText,
  onSaveNotes
}: {
  db: SystemDatabase;
  currentUser: User;
  onOpenEvent: (id: string) => void;
  onNavigateToEvents: () => void;
  onOpenAddEvent: () => void;
  onLoadSampleEvent: () => void;
  calDate: Date;
  setCalDate: React.Dispatch<React.SetStateAction<Date>>;
  notesText: string;
  setNotesText: React.Dispatch<React.SetStateAction<string>>;
  onSaveNotes: () => void;
}) {
  const totalEventsCount = db.events.length;
  const ongoingEvents = db.events.filter(e => e.status === 'Ongoing');
  const upcomingEvents = db.events.filter(e => e.status === 'Upcoming');
  const completedEvents = db.events.filter(e => e.status === 'Completed');

  const changeMonth = (offset: number) => {
    setCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const startOffset = (firstDayIndex + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const eventDaysInMonth = useMemo(() => {
    const daysMap: { [day: number]: EventItem[] } = {};
    db.events.forEach(ev => {
      if (!ev.date) return;
      const [ey, em, ed] = ev.date.split('-').map(Number);
      if (ey === year && em === month + 1) {
        if (!daysMap[ed]) daysMap[ed] = [];
        daysMap[ed].push(ev);
      }
    });
    return daysMap;
  }, [db.events, year, month]);

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-sans text-[#0b1957] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-[#5a5a55] mt-0.5">
            Welcome, {currentUser.name}! You have {totalEventsCount} event{totalEventsCount === 1 ? '' : 's'} managed.
          </p>
        </div>
        <div className="flex items-center gap-2">

          <button
            onClick={onOpenAddEvent}
            className="bg-[#0b1957] hover:bg-[#101d6b] text-[#f7f4ed] px-4 py-2.5 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Event</span>
          </button>
        </div>
      </div>

      {/* Dynamic Connected Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Events</div>
          <div className="text-3xl font-extrabold text-black mt-1">
            {totalEventsCount}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upcoming Events</div>
          <div className="text-3xl font-extrabold text-black mt-1">
            {upcomingEvents.length}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed Events</div>
          <div className="text-3xl font-extrabold text-black mt-1">
            {completedEvents.length}
          </div>
        </div>
      </div>

      {/* Main 2-column layout: Left (Ongoing + Upcoming) and Right (Calendar + Notes) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ongoing Events Section */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0b1957] flex items-center gap-1.5 font-sans">
                Ongoing Events ⏱
              </h2>
              {ongoingEvents.length > 0 && (
                <button
                  onClick={onNavigateToEvents}
                  className="text-xs font-medium text-gray-500 hover:text-[#0b1957] transition-colors cursor-pointer"
                >
                  View All
                </button>
              )}
            </div>

            {ongoingEvents.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-600">No ongoing events right now</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                  Click the "+ Add Event" button above to create an event and set its status to Ongoing.
                </p>
                <button
                  onClick={onOpenAddEvent}
                  className="mt-3 bg-[#0b1957] hover:bg-[#101d6b] text-white text-xs px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Event</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ongoingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onOpenEvent(ev.id)}
                    className="bg-white border border-[#0b1957] rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer relative group"
                  >
                    <div className="h-1.5 w-12 bg-[#0b1957] rounded-full mb-3" />
                    <h3 className="text-sm font-bold text-black group-hover:text-[#0b1957] line-clamp-1">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-[#5a5a55] mt-1">{ev.date}</p>
                    <p className="text-xs text-[#5a5a55]">{ev.time}</p>
                    <p className="text-xs font-bold text-[#101d6b] mt-3">
                      {ev.guests.length} Guest{ev.guests.length === 1 ? '' : 's'} ({ev.rsvp_count} Confirmed)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events Section */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#0b1957] flex items-center gap-1.5 font-sans">
                Upcoming Events 🔔
              </h2>
              {upcomingEvents.length > 0 && (
                <button
                  onClick={onNavigateToEvents}
                  className="text-xs font-medium text-gray-500 hover:text-[#0b1957] transition-colors cursor-pointer"
                >
                  View All
                </button>
              )}
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-600">No upcoming events scheduled yet</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                  Get started by adding your first event or loading the Jane &amp; Francis Wedding template.
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    onClick={onOpenAddEvent}
                    className="bg-[#0b1957] hover:bg-[#101d6b] text-white text-xs px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm font-medium cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Event</span>
                  </button>
                  <button
                    onClick={onLoadSampleEvent}
                    className="border border-[#0b1957] text-[#0b1957] hover:bg-blue-50 text-xs px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load Sample Template</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {upcomingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onOpenEvent(ev.id)}
                    className="bg-white border border-[#0b1957] rounded-xl px-4 py-3 flex items-center justify-between hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#0b1957]">{ev.title}</h4>
                      <div className="flex items-center gap-4 text-[11px] text-[#777777] mt-1">
                        <span>📅 {ev.date}</span>
                        <span>🕒 {ev.time}</span>
                        <span>👥 {ev.rsvp_count} / {ev.max_guests} Confirmed</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Calendar + Notes) */}
        <div className="space-y-6">
          {/* Interactive Calendar Widget connected to real event dates */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="w-7 h-7 rounded flex items-center justify-center text-[#0b1957] hover:bg-gray-100 transition-colors font-bold cursor-pointer"
              >
                &lt;
              </button>
              <span className="font-bold text-sm text-[#0b1957]">
                {monthNames[month]}, {year}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="w-7 h-7 rounded flex items-center justify-center text-[#0b1957] hover:bg-gray-100 transition-colors font-bold cursor-pointer"
              >
                &gt;
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-[10px] font-bold text-[#0b1957] py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={'empty-' + i} className="h-7" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isToday = isCurrentMonth && dayNum === today.getDate();
                const dayEvents = eventDaysInMonth[dayNum] || [];
                const hasEvent = dayEvents.length > 0;

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      if (hasEvent) {
                        onOpenEvent(dayEvents[0].id);
                      }
                    }}
                    title={hasEvent ? dayEvents.map(e => e.title).join(', ') : undefined}
                    className={`h-7 relative flex items-center justify-center text-xs rounded-lg transition-colors cursor-pointer ${
                      isToday
                        ? 'bg-[#0b1957] text-white font-bold'
                        : hasEvent
                        ? 'border border-[#0b1957] text-[#0b1957] font-bold bg-blue-50/50 hover:bg-blue-100'
                        : 'text-[#0b1957] hover:bg-gray-100'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {hasEvent && !isToday && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#0b1957]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* My Notes Section (from dashboard.py) */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0b1957] flex items-center gap-1.5 font-sans">
                📝 My Notes
              </h3>
              <p className="text-xs text-[#5a5a55] mt-0.5 mb-3">
                Write reminders for your events.
              </p>
              <textarea
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
                rows={5}
                className="w-full bg-[#fffdf6] border border-[#eee5d6] text-[#29232b] text-xs p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b1957] resize-none font-sans"
                placeholder="Enter event notes and reminders..."
              />
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={onSaveNotes}
                className="bg-[#0b1957] hover:bg-[#101d6b] text-[#f7f4ed] px-4 py-2 rounded-xl text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. EVENTS LIST PAGE (Faithful to events.py & Connected)
// ==========================================

function EventsListPage({
  events,
  onOpenEvent,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onCopyLink,
  copiedKey,
  onOpenRsvpForm,
  onExportCSV,
  onLoadSampleEvent
}: {
  events: EventItem[];
  onOpenEvent: (id: string) => void;
  onAddEvent: () => void;
  onEditEvent: (event: EventItem) => void;
  onDeleteEvent: (event: EventItem) => void;
  onCopyLink: (link: string, key?: string) => void;
  copiedKey: string | null;
  onOpenRsvpForm: (event: EventItem) => void;
  onExportCSV: (eventName: string, guests: Guest[]) => void;
  onLoadSampleEvent: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const matchesSearch =
        !searchTerm ||
        ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.status.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || ev.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, searchTerm, statusFilter]);

  // Group events by month
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: EventItem[] } = {};
    filteredEvents.forEach(ev => {
      const m = ev.month_display || 'Upcoming';
      if (!groups[m]) groups[m] = [];
      groups[m].push(ev);
    });
    return groups;
  }, [filteredEvents]);

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans text-[#0b1957] tracking-tight">
            Events
          </h1>
          <p className="text-xs text-[#5a5a55] mt-0.5">
            Manage your scheduled events, Google Form RSVP links, and attendee lists.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border border-gray-200 pl-9 pr-4 py-2 rounded-lg text-xs w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 text-xs px-3 py-2 rounded-lg font-medium text-[#0b1957] focus:outline-none cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>



          {/* Add Event Button */}
          <button
            onClick={onAddEvent}
            className="bg-[#0b1957] hover:bg-[#101d6b] text-[#f7f4ed] px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Events Grouped by Month */}
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
          <CalendarIcon className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No events created yet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            You currently have no events in your dashboard. Click the button below to add your first event with an automated Google Form RSVP link.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={onAddEvent}
              className="bg-[#0b1957] hover:bg-[#101d6b] text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Your First Event</span>
            </button>
            <button
              onClick={onLoadSampleEvent}
              className="border border-[#0b1957] text-[#0b1957] hover:bg-blue-50 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Sample Wedding Template</span>
            </button>
          </div>
        </div>
      ) : Object.keys(groupedEvents).length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-700">No events match your search</h3>
          <p className="text-xs text-gray-500 mt-1">Try clearing your search query or status filter.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([monthName, monthEvents]) => (
            <div key={monthName} className="space-y-3">
              {/* Month Bar */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-bold text-sm text-[#0b1957] uppercase tracking-wider">
                  {monthName}
                </span>
                <button
                  onClick={() => onExportCSV(monthName, monthEvents.flatMap(e => e.guests))}
                  className="text-xs text-gray-500 hover:text-[#0b1957] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Event Cards Row */}
              <div className="space-y-3">
                {monthEvents.map((ev) => {
                  const percent = Math.min(100, Math.round((ev.rsvp_count / Math.max(ev.max_guests, 1)) * 100));
                  const isCopied = copiedKey === 'list_' + ev.id;
                  const realUrl = getEventRsvpWebUrl(ev.id, ev);

                  return (
                    <div
                      key={ev.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-[#0b1957] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                      onClick={() => onOpenEvent(ev.id)}
                    >
                      {/* Left: Date & Title Info */}
                      <div className="flex items-center gap-4">
                        {/* Red Date block */}
                        <div className="w-12 h-12 rounded-lg bg-red-50 text-[#d62828] flex flex-col items-center justify-center font-bold text-xs leading-tight shrink-0 border border-red-100">
                          {ev.day_display.split('\n').map((line, idx) => (
                            <span key={idx} className={idx === 1 ? 'text-base font-extrabold' : 'uppercase text-[10px]'}>
                              {line}
                            </span>
                          ))}
                        </div>

                        {/* Icon Block */}
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">
                          {ev.title.toLowerCase().includes('wedding') ? '💍' : ev.title.toLowerCase().includes('birthday') ? '🎂' : '🎨'}
                        </div>

                        {/* Title & Desc */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 hover:text-[#0b1957]">
                              {ev.title}
                            </h3>
                            <span className="text-[11px] text-gray-400">• {ev.location}</span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{ev.desc}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {/* Copy Link Button with live Copied state - Copies https://forms.gle/aFGNLexpupZkvvpr8 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopyLink(ev.rsvp_link || DEFAULT_GFORM_RSVP_URL, 'list_' + ev.id);
                              }}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                                isCopied
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-[#0b1957]'
                              }`}
                              title="Copy Google Form RSVP Link"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopied ? 'Copied!' : 'Copy RSVP Link'}</span>
                            </button>

                            {/* Open RSVP Form Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(ev.rsvp_link || DEFAULT_GFORM_RSVP_URL, '_blank');
                              }}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                              title="Open Google Form in a new tab"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open RSVP Form</span>
                            </button>

                            <span className="text-[11px] text-gray-400">Time: {ev.time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: RSVP Circular Progress, Status, and Action Buttons */}
                      <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                        {/* Circular Progress + RSVP text */}
                        <div className="flex items-center gap-2">
                          <div className="relative w-7 h-7 flex items-center justify-center">
                            <svg className="w-7 h-7 transform -rotate-90">
                              <circle
                                cx="14"
                                cy="14"
                                r="10"
                                stroke="#f0f0f0"
                                strokeWidth="3"
                                fill="transparent"
                              />
                              <circle
                                cx="14"
                                cy="14"
                                r="10"
                                stroke="#d62828"
                                strokeWidth="3"
                                fill="transparent"
                                strokeDasharray={62.8}
                                strokeDashoffset={62.8 - (62.8 * percent) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            {ev.rsvp_count} / {ev.max_guests}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            ev.status === 'Completed'
                              ? 'bg-gray-100 text-gray-700'
                              : ev.status === 'Ongoing'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {ev.status}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditEvent(ev);
                            }}
                            title="Edit Event"
                            className="p-1.5 rounded-md text-gray-500 hover:text-[#0b1957] hover:bg-gray-100 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteEvent(ev);
                            }}
                            title="Delete Event"
                            className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onExportCSV(ev.title, ev.guests);
                            }}
                            title="Export Guest List"
                            className="p-1.5 rounded-md text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. EVENT DETAIL PAGE: INSIDE THE EVENT CARD
// (EXACT DESIRED DESIGN FROM 2ND FILE)
// ==========================================

function EventDetailPage({
  event,
  onBack,
  onUpdateGuests,
  onDeleteGuest,
  onAddGuest,
  onCopyLink,
  isCopied,
  onOpenRsvpForm,
  onOpenBroadcast,
  onExportCSV,
  onLoadSampleGuests,
  onUpdateEvent,
  showToast
}: {
  event: EventItem;
  onBack: () => void;
  onUpdateGuests: (newGuests: Guest[]) => void;
  onDeleteGuest: (guestId: string) => void;
  onAddGuest: (guest: Omit<Guest, 'id'>) => void;
  onCopyLink: (link: string) => void;
  isCopied: boolean;
  onOpenRsvpForm: () => void;
  onOpenBroadcast: () => void;
  onExportCSV: () => void;
  onLoadSampleGuests: () => void;
  onUpdateEvent?: (updated: Partial<EventItem>) => void;
  showToast?: (msg: string) => void;
}) {
  // Tabs: 'All' | 'Attendance'
  const [activeTab, setActiveTab] = useState<'All' | 'Attendance'>('All');

  // Search & Filter
  const [guestSearch, setGuestSearch] = useState<string>('');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  // Modals
  const [showAddGuestModal, setShowAddGuestModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Active status menu open for an individual row
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

  // Upload RSVP Link modal state
  const [showUploadLinkModal, setShowUploadLinkModal] = useState<boolean>(false);

  // Dynamic tailored Google Form URL for this event (customized with title, desc, date, time, location)
  const dynamicEventUrl = getEventRsvpWebUrl(event.id, event);

  // Prioritize the uploaded/saved RSVP link (e.g. Google Form link)
  const rawUploadedLink = (event.rsvp_link && event.rsvp_link.trim().length > 0)
    ? event.rsvp_link.trim()
    : DEFAULT_GFORM_RSVP_URL;
  const targetRsvpUrl = rawUploadedLink.startsWith('http://') || rawUploadedLink.startsWith('https://')
    ? rawUploadedLink
    : `https://${rawUploadedLink}`;
  const realRsvpUrl = targetRsvpUrl;

  // Dynamic connected stats
  const totalInvitedCount = event.guests.length;
  const confirmedCount = event.guests.filter(g => g.rsvp === 'Confirmed').length;
  const declinedCount = event.guests.filter(g => g.rsvp === 'Declined').length;
  const pendingCount = event.guests.filter(g => g.rsvp === 'Pending').length;

  const attendedCount = event.guests.filter(g => g.attendance === 'Attended').length;
  const absentCount = event.guests.filter(g => g.attendance === 'Absent').length;

  // Filtered guests list
  const filteredGuests = useMemo(() => {
    return event.guests.filter(g => {
      const matchesSearch =
        !guestSearch ||
        g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
        g.email.toLowerCase().includes(guestSearch.toLowerCase());

      let matchesFilter = true;
      if (selectedFilter === 'Confirmed') matchesFilter = g.rsvp === 'Confirmed';
      else if (selectedFilter === 'Pending') matchesFilter = g.rsvp === 'Pending';
      else if (selectedFilter === 'Declined') matchesFilter = g.rsvp === 'Declined';
      else if (selectedFilter === 'Attended') matchesFilter = g.attendance === 'Attended';
      else if (selectedFilter === 'Absent') matchesFilter = g.attendance === 'Absent';
      else if (selectedFilter === 'Invited') matchesFilter = g.invited;
      else if (selectedFilter === 'Not Invited') matchesFilter = !g.invited;

      return matchesSearch && matchesFilter;
    });
  }, [event.guests, guestSearch, selectedFilter]);

  // Toggle guest invited checkbox
  const toggleInvited = (guestId: string) => {
    const updated = event.guests.map(g => {
      if (g.id === guestId) {
        return { ...g, invited: !g.invited };
      }
      return g;
    });
    onUpdateGuests(updated);
  };

  // Change RSVP status
  const changeRsvpStatus = (guestId: string, newRsvp: RSVPStatus) => {
    const updated = event.guests.map(g => {
      if (g.id === guestId) {
        return { ...g, rsvp: newRsvp };
      }
      return g;
    });
    onUpdateGuests(updated);
    setOpenStatusMenuId(null);
  };

  // Change Attendance status
  const changeAttendanceStatus = (guestId: string, newAtt: AttendanceStatus) => {
    const updated = event.guests.map(g => {
      if (g.id === guestId) {
        return { ...g, attendance: newAtt };
      }
      return g;
    });
    onUpdateGuests(updated);
    setOpenStatusMenuId(null);
  };

  // Close dropdown on outside click
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pre-formatted email invitation text
  const emailSubject = `RSVP Invitation: ${event.title}`;
  const emailBody = `Dear Guest,\n\nYou are cordially invited to attend ${event.title}!\n\n📅 Date & Time: ${event.date} at ${event.time}\n📍 Location: ${event.location}\n\nPlease confirm your RSVP by clicking this official link:\n${realRsvpUrl}\n\nWe look forward to seeing you!\n- EManage Event Host`;

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Back button breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <button
          onClick={onBack}
          className="hover:text-[#0b1957] flex items-center gap-1 font-medium transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </button>
        <span>/</span>
        <span className="text-gray-800 font-semibold">{event.title}</span>
      </div>

      {/* TOP EVENT HEADER (Matching VIEW EVENT ALL.png) */}
      <div className="bg-transparent border-b border-gray-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Event Title, Date & Time, Location */}
        <div className="flex flex-wrap items-center gap-6">
          <h1 className="text-2xl font-bold font-sans text-black tracking-tight">
            {event.title}
          </h1>

          <div className="h-6 w-px bg-gray-300 hidden md:block" />

          <div className="text-xs text-gray-700 flex items-center gap-2">
            <span className="font-medium text-gray-500">Date &amp; Time:</span>
            <span className="font-semibold text-black">
              {event.date ? event.date.replace(/-/g, '/') : '10/05/2026'}
            </span>
            <span className="font-semibold text-black">{event.time}</span>
          </div>

          <div className="h-6 w-px bg-gray-300 hidden md:block" />

          <div className="text-xs text-gray-700 flex items-center gap-2">
            <span className="font-medium text-gray-500">Location:</span>
            <span className="font-semibold text-black">{event.location}</span>
          </div>
        </div>

        {/* Right: Upload RSVP Link, Open RSVP Form, & Functional Copy Link Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Upload RSVP Link Button (Connect Google Form link and guest list) */}
          <button
            onClick={() => setShowUploadLinkModal(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-[#0b1957] border border-indigo-200 px-4 py-2.5 rounded-full font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Upload RSVP Link and connect Google Form responses to guest list"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#0b1957]" />
            <span>Upload RSVP Link</span>
          </button>

          {/* Open Google Form RSVP button */}
          <button
            onClick={() => {
              window.open(targetRsvpUrl, '_blank');
            }}
            className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-3.5 py-2.5 rounded-full font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Open and preview the Google Form in Google Chrome"
          >
            <ExternalLink className="w-3.5 h-3.5 text-purple-700" />
            <span>Open RSVP Form</span>
          </button>

          {/* Truly functional Copy Link button with Copied state - Copies https://forms.gle/aFGNLexpupZkvvpr8 */}
          <button
            onClick={() => onCopyLink(targetRsvpUrl)}
            className={`px-5 py-2.5 rounded-full font-medium text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              isCopied
                ? 'bg-emerald-600 text-white'
                : 'bg-[#0b1957] hover:bg-[#101d6b] text-white'
            }`}
            title="Click to copy the Google Form RSVP link"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SUB-HEADER: Title "Guest List", Search input, Filter slider, Tabs ("All" & "Attendance"), "+ Add Guest" */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <h2 className="text-xl font-bold text-black font-sans">
          Guest List
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search guests input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search guests..."
              value={guestSearch}
              onChange={e => setGuestSearch(e.target.value)}
              className="bg-[#fffdf6] border border-gray-300 px-4 py-2 rounded-full text-xs w-56 sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
            />
          </div>

          {/* Filter icon button with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                showFilterDropdown ? 'bg-[#0b1957] text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="Filter Guests"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1.5 text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400">Filter By Status</div>
                {['All', 'Confirmed', 'Pending', 'Declined', 'Attended', 'Absent', 'Invited'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedFilter(opt);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer ${
                      selectedFilter === opt ? 'font-bold text-[#0b1957]' : 'text-gray-700'
                    }`}
                  >
                    <span>{opt}</span>
                    {selectedFilter === opt && <Check className="w-3 h-3 text-[#0b1957]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Tabs: "All" & "Attendance" */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('All')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'All'
                  ? 'bg-[#0b1957] text-white shadow'
                  : 'bg-transparent text-gray-700 hover:text-black font-medium'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('Attendance')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'Attendance'
                  ? 'bg-[#0b1957] text-white shadow'
                  : 'bg-transparent text-gray-700 hover:text-black font-medium'
              }`}
            >
              Attendance
            </button>
          </div>

          {/* + Add Guest Button */}
          <button
            onClick={() => setShowAddGuestModal(true)}
            className="bg-[#0b1957] hover:bg-[#101d6b] text-white px-4 py-2 rounded-full font-medium text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Guest</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS ROW */}
      {activeTab === 'All' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Total Invited */}
          <div className="bg-white border border-gray-300 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-3xl font-extrabold text-black">{totalInvitedCount}</div>
              <div className="text-xs text-gray-600 mt-1 font-medium">Total Invited</div>
            </div>
            <div className="w-11 h-11 rounded-full border border-gray-300 flex items-center justify-center text-gray-600">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Confirmed */}
          <div className="bg-white border border-gray-300 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-3xl font-extrabold text-black">{confirmedCount}</div>
              <div className="text-xs text-gray-600 mt-1 font-medium">Confirmed</div>
            </div>
            <div className="w-11 h-11 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Declined */}
          <div className="bg-white border border-gray-300 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-3xl font-extrabold text-black">{declinedCount}</div>
              <div className="text-xs text-gray-600 mt-1 font-medium">Declined</div>
            </div>
            <div className="w-11 h-11 rounded-full border border-rose-300 bg-rose-50 text-rose-500 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Pending */}
          <div className="bg-white border border-gray-300 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-3xl font-extrabold text-black">{pendingCount}</div>
              <div className="text-xs text-gray-600 mt-1 font-medium">Pending</div>
            </div>
            <div className="w-11 h-11 rounded-full border border-amber-300 bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Invited */}
          <div className="bg-white border border-gray-300 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-3xl font-extrabold text-black">{totalInvitedCount}</div>
              <div className="text-xs text-gray-600 mt-1 font-medium">Total Invited</div>
            </div>
            <div className="w-11 h-11 rounded-full border border-gray-300 flex items-center justify-center text-gray-600">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Attended */}
          <div className="bg-white border border-gray-300 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-3xl font-extrabold text-black">{attendedCount}</div>
              <div className="text-xs text-gray-600 mt-1 font-medium">Attended</div>
            </div>
            <div className="w-11 h-11 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Absent */}
          <div className="bg-white border border-gray-300 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-3xl font-extrabold text-black">{absentCount}</div>
              <div className="text-xs text-gray-600 mt-1 font-medium">Absent</div>
            </div>
            <div className="w-11 h-11 rounded-full border border-rose-300 bg-rose-50 text-rose-500 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* ACTION BAR: "Import Guest List", "Send RSVP Link to All Guests", and "Export CSV" */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-[#0b1957] hover:bg-[#101d6b] text-white px-5 py-2.5 rounded-full font-medium text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Guest List</span>
          </button>

          {/* Send RSVP Link to All Guests button */}
          <button
            onClick={onOpenBroadcast}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-full font-medium text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send RSVP Link to All Guests</span>
          </button>

          {event.guests.length === 0 && (
            <button
              onClick={onLoadSampleGuests}
              className="border border-[#0b1957] text-[#0b1957] hover:bg-blue-50 px-4 py-2.5 rounded-full font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load 50 Sample Guests</span>
            </button>
          )}
        </div>

        <button
          onClick={onExportCSV}
          disabled={event.guests.length === 0}
          className="bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-[#0b1957] px-4 py-2 rounded-full font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* GUEST LIST TABLE (With "Email" column header and direct individual Gmail send button) */}
      <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-gray-700 bg-white">
                <th className="py-4 px-6 font-semibold w-1/4">Name</th>
                <th className="py-4 px-6 font-semibold text-center w-28">Invited</th>
                {/* Changed from "Contact Information" to "Email" */}
                <th className="py-4 px-6 font-semibold w-1/3">Email</th>
                <th className="py-4 px-6 font-semibold text-center w-40">
                  {activeTab === 'All' ? 'RSVP' : 'Attendance'}
                </th>
                <th className="py-4 px-6 font-semibold text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <p className="font-semibold text-gray-600">No guests found in this list</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Click "+ Add Guest" to add an attendee, or "Import Guest List" to upload a CSV.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-amber-50/20 transition-colors">
                    {/* Name */}
                    <td className="py-4 px-6 font-medium text-black">
                      <div>{guest.name}</div>
                      {guest.notes && (
                        <div className="text-[10px] text-gray-400 italic mt-0.5">Note: {guest.notes}</div>
                      )}
                    </td>

                    {/* Invited (custom dark rounded checkbox as in mockup) */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => toggleInvited(guest.id)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-colors cursor-pointer ${
                          guest.invited
                            ? 'bg-black text-white'
                            : 'border-2 border-black bg-white'
                        }`}
                        title={guest.invited ? 'Invited' : 'Not Invited'}
                      >
                        {guest.invited && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    </td>

                    {/* Email column */}
                    <td className="py-4 px-6 text-gray-700 font-mono text-xs">
                      {guest.email}
                    </td>

                    {/* RSVP or Attendance badge button with dropdown */}
                    <td className="py-4 px-6 text-center relative">
                      {activeTab === 'All' ? (
                        <div className="inline-block relative">
                          <button
                            onClick={() => setOpenStatusMenuId(openStatusMenuId === guest.id ? null : guest.id)}
                            className={`px-3 py-1.5 rounded-lg border flex items-center justify-between gap-2 min-w-[110px] font-medium text-xs shadow-2xs transition-all cursor-pointer ${
                              guest.rsvp === 'Confirmed'
                                ? 'bg-[#c6f6d5] border-emerald-300 text-[#15803d]'
                                : guest.rsvp === 'Pending'
                                ? 'bg-[#fef3c7] border-amber-300 text-[#92400e]'
                                : 'bg-[#fee2e2] border-rose-300 text-[#b91c1c]'
                            }`}
                          >
                            <span>{guest.rsvp}</span>
                            <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          </button>

                          {/* RSVP status selection popover */}
                          {openStatusMenuId === guest.id && (
                            <div className="absolute top-full mt-1 left-0 w-32 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 text-left">
                              <button
                                onClick={() => changeRsvpStatus(guest.id, 'Confirmed')}
                                className="w-full px-3 py-1.5 hover:bg-emerald-50 text-emerald-800 flex items-center justify-between cursor-pointer"
                              >
                                <span>Confirmed</span>
                                {guest.rsvp === 'Confirmed' && <Check className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => changeRsvpStatus(guest.id, 'Pending')}
                                className="w-full px-3 py-1.5 hover:bg-amber-50 text-amber-800 flex items-center justify-between cursor-pointer"
                              >
                                <span>Pending</span>
                                {guest.rsvp === 'Pending' && <Check className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => changeRsvpStatus(guest.id, 'Declined')}
                                className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-800 flex items-center justify-between cursor-pointer"
                              >
                                <span>Declined</span>
                                {guest.rsvp === 'Declined' && <Check className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="inline-block relative">
                          <button
                            onClick={() => setOpenStatusMenuId(openStatusMenuId === guest.id ? null : guest.id)}
                            className={`px-3 py-1.5 rounded-lg border flex items-center justify-between gap-2 min-w-[110px] font-medium text-xs shadow-2xs transition-all cursor-pointer ${
                              guest.attendance === 'Attended'
                                ? 'bg-[#c6f6d5] border-emerald-300 text-[#15803d]'
                                : 'bg-[#fee2e2] border-rose-300 text-[#b91c1c]'
                            }`}
                          >
                            <span>{guest.attendance}</span>
                            <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          </button>

                          {/* Attendance status selection popover */}
                          {openStatusMenuId === guest.id && (
                            <div className="absolute top-full mt-1 left-0 w-32 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 text-left">
                              <button
                                onClick={() => changeAttendanceStatus(guest.id, 'Attended')}
                                className="w-full px-3 py-1.5 hover:bg-emerald-50 text-emerald-800 flex items-center justify-between cursor-pointer"
                              >
                                <span>Attended</span>
                                {guest.attendance === 'Attended' && <Check className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => changeAttendanceStatus(guest.id, 'Absent')}
                                className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-800 flex items-center justify-between cursor-pointer"
                              >
                                <span>Absent</span>
                                {guest.attendance === 'Absent' && <Check className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions: Direct Gmail sending + Delete */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Direct Gmail send button for this guest */}
                        <a
                          href={createGmailComposeUrl(
                            [guest.email],
                            `RSVP Invitation for ${guest.name}: ${event.title}`,
                            `Hi ${guest.name},\n\nYou are cordially invited to attend ${event.title}!\n\n📅 Date & Time: ${event.date} at ${event.time}\n📍 Location: ${event.location}\n\nPlease submit your RSVP response here:\n${realRsvpUrl}\n\nWarm regards,\nEManage Host`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                          title={`Send RSVP to ${guest.name} via Gmail`}
                        >
                          <Mail className="w-4 h-4" />
                        </a>

                        {/* Delete guest button */}
                        <button
                          onClick={() => onDeleteGuest(guest.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors cursor-pointer"
                          title="Delete Guest"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD GUEST MODAL */}
      {showAddGuestModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="font-bold text-base text-[#0b1957]">Add New Guest</h3>
              <button onClick={() => setShowAddGuestModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = (form.elements.namedItem('guestName') as HTMLInputElement).value;
                const email = (form.elements.namedItem('guestEmail') as HTMLInputElement).value;
                const invited = (form.elements.namedItem('guestInvited') as HTMLInputElement).checked;
                const rsvp = (form.elements.namedItem('guestRsvp') as HTMLSelectElement).value as RSVPStatus;
                const attendance = (form.elements.namedItem('guestAttendance') as HTMLSelectElement).value as AttendanceStatus;

                if (!name || !email) return;
                onAddGuest({ name, email, invited, rsvp, attendance });
                setShowAddGuestModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Guest Full Name</label>
                <input
                  name="guestName"
                  required
                  placeholder="e.g. Eleanor Vance"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  name="guestEmail"
                  type="email"
                  required
                  placeholder="e.g. eleanor@example.com"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">RSVP Status</label>
                  <select
                    name="guestRsvp"
                    defaultValue="Pending"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Attendance Status</label>
                  <select
                    name="guestAttendance"
                    defaultValue="Absent"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Attended">Attended</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="invitedCheck"
                  name="guestInvited"
                  defaultChecked
                  className="w-4 h-4 rounded text-[#0b1957] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="invitedCheck" className="text-gray-700 font-medium cursor-pointer">
                  Mark as officially invited
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddGuestModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0b1957] hover:bg-[#101d6b] text-white px-5 py-2 rounded-lg font-medium shadow cursor-pointer"
                >
                  Add Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT GUEST LIST MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="font-bold text-base text-[#0b1957]">Import Guest List</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-gray-600">
                Upload a CSV file or paste formatted text with <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">Name,Email,Status</code> to bulk-import guests into <strong>{event.title}</strong>.
              </p>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Paste CSV / Rows</label>
                <textarea
                  id="csvPasteBox"
                  rows={5}
                  placeholder={`Name,Email,Status\nJohn Doe,john@example.com,Confirmed\nJane Smith,jane@example.com,Pending`}
                  className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                />
              </div>

              <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center bg-gray-50">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  id="csvFileInput"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        const box = document.getElementById('csvPasteBox') as HTMLTextAreaElement;
                        if (box) box.value = content;
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
                <label htmlFor="csvFileInput" className="cursor-pointer block">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <span className="text-[#0b1957] font-semibold hover:underline">Choose CSV file</span>
                  <span className="text-gray-500 block text-[11px] mt-0.5">or drop file here</span>
                </label>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    const sample = "Name,Email,Status\nLucas Kane,lucas@example.com,Confirmed\nSophia Perez,sophia@example.com,Pending\nMateo Rossi,mateo@example.com,Declined";
                    const box = document.getElementById('csvPasteBox') as HTMLTextAreaElement;
                    if (box) box.value = sample;
                  }}
                  className="text-gray-500 hover:text-black text-[11px] underline cursor-pointer"
                >
                  Load Sample Data
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const box = document.getElementById('csvPasteBox') as HTMLTextAreaElement;
                      const raw = box?.value.trim();
                      if (!raw) return;

                      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
                      const parsedGuests: Guest[] = [];

                      lines.forEach((line, idx) => {
                        if (idx === 0 && line.toLowerCase().includes('name') && line.toLowerCase().includes('email')) {
                          return;
                        }
                        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
                        if (parts.length >= 2) {
                          const name = parts[0];
                          const email = parts[1];
                          const rawStatus = (parts[2] || '').toLowerCase();
                          let rsvp: RSVPStatus = 'Pending';
                          if (rawStatus.includes('confirm')) rsvp = 'Confirmed';
                          else if (rawStatus.includes('declin')) rsvp = 'Declined';

                          parsedGuests.push({
                            id: 'g_' + Math.random().toString(36).substring(2, 9),
                            name,
                            email,
                            invited: true,
                            rsvp,
                            attendance: rsvp === 'Confirmed' ? 'Attended' : 'Absent'
                          });
                        }
                      });

                      if (parsedGuests.length > 0) {
                        onUpdateGuests([...parsedGuests, ...event.guests]);
                        setShowImportModal(false);
                      }
                    }}
                    className="bg-[#0b1957] hover:bg-[#101d6b] text-white px-5 py-2 rounded-lg font-medium shadow cursor-pointer"
                  >
                    Import Guests
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD RSVP LINK & RESPONSES SYNC MODAL */}
      {showUploadLinkModal && (
        <UploadRsvpLinkModal
          isOpen={showUploadLinkModal}
          onClose={() => setShowUploadLinkModal(false)}
          event={event}
          onUpdateRsvpLink={(newLink) => {
            if (onUpdateEvent) {
              onUpdateEvent({ rsvp_link: newLink });
            }
          }}
          onGuestsUpdated={onUpdateGuests}
          onToast={showToast || (() => {})}
        />
      )}
    </div>
  );
}

// ==========================================
// 6. UPLOAD RSVP LINK & GUEST LIST SYNC MODAL
// ==========================================

function UploadRsvpLinkModal({
  isOpen,
  onClose,
  event,
  onUpdateRsvpLink,
  onGuestsUpdated,
  onToast
}: {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  onUpdateRsvpLink: (newLink: string) => void;
  onGuestsUpdated: (newGuests: Guest[]) => void;
  onToast: (msg: string) => void;
}) {
  const dynamicEventUrl = getEventRsvpWebUrl(event.id, event);
  const category = getEventCategory(event.title, event.desc);
  const [rsvpLink, setRsvpLink] = useState(event.rsvp_link || dynamicEventUrl);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'sheet' | 'simulate' | 'webhook' | 'paste'>('preview');

  // Sheet sync state
  const [sheetUrl, setSheetUrl] = useState('');
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Simulator / manual response state
  const [simName, setSimName] = useState('');
  const [simEmail, setSimEmail] = useState('');
  const [simRsvp, setSimRsvp] = useState<RSVPStatus>('Confirmed');
  const [simNotes, setSimNotes] = useState('');
  const [isSubmittingSim, setIsSubmittingSim] = useState(false);

  // Paste / CSV state
  const [pasteRows, setPasteRows] = useState('');

  // Webhook copy state
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedFormText, setCopiedFormText] = useState(false);

  // Stats computed from event.guests
  const confirmedCount = event.guests.filter(g => g.rsvp === 'Confirmed').length;
  const declinedCount = event.guests.filter(g => g.rsvp === 'Declined').length;
  const pendingCount = event.guests.filter(g => g.rsvp === 'Pending').length;
  const totalCount = event.guests.length;

  if (!isOpen) return null;

  // Save updated RSVP link
  const handleSaveRsvpLink = async (linkToSave?: string) => {
    const finalLink = (linkToSave || rsvpLink).trim() || dynamicEventUrl;
    setRsvpLink(finalLink);
    onUpdateRsvpLink(finalLink);
    try {
      await fetch(`/api/events/${event.id}/rsvp-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvp_link: finalLink })
      });
    } catch (e) {
      console.warn('Could not save to server', e);
    }
    onToast(`RSVP link for "${event.title}" saved!`);
  };

  // Copy link
  const handleCopyLink = async () => {
    const finalLink = rsvpLink.trim() || dynamicEventUrl;
    try {
      await navigator.clipboard.writeText(finalLink);
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2000);
      onToast('Google Form link copied to clipboard!');
    } catch (e) {
      console.warn('Failed to copy', e);
    }
  };

  // Copy Google Form setup template
  const handleCopyFormTemplate = async () => {
    const templateText = `GOOGLE FORM TEMPLATE FOR: ${event.title}\n` +
      `Category: ${category.name}\n` +
      `Description: ${event.desc || 'Please confirm your attendance.'}\n` +
      `Date & Time: ${event.date} at ${event.time}\n` +
      `Location: ${event.location}\n\n` +
      `FORM QUESTIONS:\n` +
      `1. Full Name (Short Answer, Required)\n` +
      `2. Email Address (Short Answer, Required)\n` +
      `3. ${category.attendanceQuestion} (Multiple Choice, Required)\n` +
      `   - ${category.confirmText}\n` +
      `   - ${category.declineText}\n` +
      `4. ${category.companionLabel} (Short Answer / Number)\n` +
      `5. ${category.notesLabel} (Paragraph, Optional)\n`;

    try {
      await navigator.clipboard.writeText(templateText);
      setCopiedFormText(true);
      setTimeout(() => setCopiedFormText(false), 2500);
      onToast('Google Form questions & template text copied!');
    } catch (e) {
      console.warn('Failed to copy', e);
    }
  };

  // Sync Google Sheet
  const handleSyncSheet = async () => {
    if (!sheetUrl.trim()) {
      setSyncStatus({ success: false, message: 'Please enter your Google Sheet responses URL.' });
      return;
    }
    setIsSyncingSheet(true);
    setSyncStatus(null);

    try {
      const res = await fetch('/api/sync-gform-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, sheetUrl: sheetUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync responses');
      }

      if (data.event && Array.isArray(data.event.guests)) {
        onGuestsUpdated(data.event.guests);
      }
      setSyncStatus({
        success: true,
        message: `Successfully synced! Added ${data.addedCount || 0}, Updated ${data.updatedCount || 0}. Confirmed: ${data.confirmed}, Declined: ${data.declined}, Pending: ${data.pending}.`
      });
      onToast(`Synced responses! ${data.confirmed} Confirmed, ${data.declined} Declined, ${data.pending} Pending`);
    } catch (err: any) {
      setSyncStatus({
        success: false,
        message: err.message || 'Error syncing responses from Google Sheet.'
      });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Submit test/live response into guest list
  const handleSubmitSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim()) return;

    setIsSubmittingSim(true);
    try {
      const res = await fetch('/api/gform-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          name: simName.trim(),
          email: simEmail.trim() || `${simName.trim().toLowerCase().replace(/\s+/g, '.')}@guest.com`,
          rsvp: simRsvp,
          notes: simNotes
        })
      });
      const data = await res.json();
      if (data.event && Array.isArray(data.event.guests)) {
        onGuestsUpdated(data.event.guests);
      } else {
        // Fallback local merge
        const newGuest: Guest = {
          id: 'g_' + Math.random().toString(36).substring(2, 9),
          name: simName.trim(),
          email: simEmail.trim() || `${simName.trim().toLowerCase().replace(/\s+/g, '.')}@guest.com`,
          invited: true,
          rsvp: simRsvp,
          attendance: simRsvp === 'Confirmed' ? 'Attended' : 'Absent',
          notes: simNotes
        };
        const existing = event.guests.filter(
          g => g.email.toLowerCase() !== newGuest.email.toLowerCase() && g.name.toLowerCase() !== newGuest.name.toLowerCase()
        );
        onGuestsUpdated([newGuest, ...existing]);
      }

      onToast(`Recorded Google Form RSVP: ${simName} is ${simRsvp}!`);
      setSimName('');
      setSimEmail('');
      setSimNotes('');
    } catch (err: any) {
      onToast(`Recorded response locally: ${simName} (${simRsvp})`);
    } finally {
      setIsSubmittingSim(false);
    }
  };

  // Import pasted rows
  const handleImportPaste = () => {
    if (!pasteRows.trim()) return;
    const lines = pasteRows.split('\n').map(l => l.trim()).filter(Boolean);
    const newGuests: Guest[] = [];

    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes('name') && line.toLowerCase().includes('email')) {
        return;
      }
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 1 && parts[0]) {
        const name = parts[0];
        const email = parts[1] || `${name.toLowerCase().replace(/\s+/g, '.')}@guest.com`;
        const rawStatus = (parts[2] || 'Confirmed').toLowerCase();
        let rsvp: RSVPStatus = 'Confirmed';
        if (rawStatus.includes('declin') || rawStatus.includes('no') || rawStatus.includes('cannot')) {
          rsvp = 'Declined';
        } else if (rawStatus.includes('pend') || rawStatus.includes('maybe')) {
          rsvp = 'Pending';
        }

        newGuests.push({
          id: 'g_' + Math.random().toString(36).substring(2, 9),
          name,
          email,
          invited: true,
          rsvp,
          attendance: rsvp === 'Confirmed' ? 'Attended' : 'Absent',
          notes: 'Pasted from Google Form responses'
        });
      }
    });

    if (newGuests.length > 0) {
      // Merge with existing
      const existing = [...event.guests];
      newGuests.forEach(ng => {
        const idx = existing.findIndex(
          g => g.email.toLowerCase() === ng.email.toLowerCase() || g.name.toLowerCase() === ng.name.toLowerCase()
        );
        if (idx >= 0) {
          existing[idx] = ng;
        } else {
          existing.unshift(ng);
        }
      });
      onGuestsUpdated(existing);
      setPasteRows('');
      onToast(`Imported ${newGuests.length} Google Form responses into guest list!`);
    }
  };

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/gform-webhook?eventId=${event.id}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl border border-gray-100 space-y-5 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#0b1957]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#0b1957]">Upload RSVP Link &amp; Custom Form</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${category.tagColor}`}>
                  {category.icon} {category.name}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Customized Google Form content dynamically adapts to <strong>"{event.title}"</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: GOOGLE FORM RSVP LINK */}
        <div className="bg-[#fffdf6] border border-[#eee5d6] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#0b1957]" />
              <span>Active RSVP Link (Destination for "Copy Link" &amp; "Open RSVP Form")</span>
            </label>
            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
              {rsvpLink.includes('forms.gle') ? 'External Form' : 'Dynamic Event Form'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={rsvpLink}
              onChange={(e) => setRsvpLink(e.target.value)}
              placeholder={dynamicEventUrl}
              className="flex-1 bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs font-mono text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleSaveRsvpLink()}
                className="bg-[#0b1957] hover:bg-[#101d6b] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Save this RSVP link for the event"
              >
                Save Link
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
                  isCopiedLink
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                }`}
                title="Copy link to clipboard"
              >
                {isCopiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
              <a
                href={rsvpLink.trim() || dynamicEventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1 cursor-pointer"
                title="Open Google Form in a new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </a>
            </div>
          </div>

          {/* Quick Preset Selector Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-dashed border-gray-200">
            <span className="text-[11px] text-gray-500 font-medium">Quick Presets:</span>
            <button
              type="button"
              onClick={() => handleSaveRsvpLink(dynamicEventUrl)}
              className="bg-indigo-50 hover:bg-indigo-100 text-[#0b1957] border border-indigo-200 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Auto-generates Google Form customized with this event's title, description, and date"
            >
              <span>✨ Use Form Customized for "{event.title}"</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveRsvpLink(DEFAULT_GFORM_RSVP_URL)}
              className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Use external Wedding Google Form"
            >
              <span>💍 Use Wedding Form (forms.gle)</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: LIVE STATS BAR */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5">
            <div className="text-xl font-extrabold text-black">{totalCount}</div>
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Total Guests</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
            <div className="text-xl font-extrabold text-emerald-700">{confirmedCount}</div>
            <div className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">Confirmed</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5">
            <div className="text-xl font-extrabold text-rose-700">{declinedCount}</div>
            <div className="text-[10px] text-rose-700 font-semibold uppercase tracking-wider">Declined</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
            <div className="text-xl font-extrabold text-amber-700">{pendingCount}</div>
            <div className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider">Pending</div>
          </div>
        </div>

        {/* SECTION 3: TABS FOR CONNECTING GOOGLE FORM RESPONSES */}
        <div className="space-y-3">
          <div className="flex border-b border-gray-200 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('preview')}
              className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'preview'
                  ? 'border-[#0b1957] text-[#0b1957]'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Form Content for this Event</span>
            </button>
            <button
              onClick={() => setActiveTab('sheet')}
              className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'sheet'
                  ? 'border-[#0b1957] text-[#0b1957]'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>1-Click Google Sheet Sync</span>
            </button>
            <button
              onClick={() => setActiveTab('simulate')}
              className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'simulate'
                  ? 'border-[#0b1957] text-[#0b1957]'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live Response Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('webhook')}
              className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'webhook'
                  ? 'border-[#0b1957] text-[#0b1957]'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Automated Webhook</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'paste'
                  ? 'border-[#0b1957] text-[#0b1957]'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Paste CSV Rows</span>
            </button>
          </div>

          {/* TAB 0: FORM CONTENT FOR THIS EVENT */}
          {activeTab === 'preview' && (
            <div className="space-y-3 pt-1 text-xs">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-gray-800 text-xs">Dynamic Google Form Structure:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${category.tagColor}`}>
                    {category.icon} {category.name}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-sm font-bold text-gray-900">{event.title}</div>
                  <div className="text-gray-600 leading-relaxed text-xs">
                    {event.desc || 'Please confirm your attendance for our upcoming event.'}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">
                    📅 {event.date} at {event.time} • 📍 {event.location}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-1.5 text-[11px] text-gray-700">
                  <div className="font-bold text-gray-900">Configured Questions for this Event:</div>
                  <div>1. <strong>Full Name</strong> (Required)</div>
                  <div>2. <strong>Email Address</strong> (Required for guest verification)</div>
                  <div>3. <strong>{category.attendanceQuestion}</strong> (Choice: <em>{category.confirmText}</em> / <em>{category.declineText}</em>)</div>
                  <div>4. <strong>{category.companionLabel}</strong></div>
                  <div>5. <strong>{category.notesLabel}</strong></div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={handleCopyFormTemplate}
                    className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedFormText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFormText ? 'Copied Template!' : 'Copy Form Setup Content'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href="https://forms.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0b1957] hover:underline font-semibold text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Create on Google (forms.new)</span>
                    </a>
                    <a
                      href={dynamicEventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0b1957] hover:bg-[#101d6b] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview Form in Chrome</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: GOOGLE SHEET SYNC */}
          {activeTab === 'sheet' && (
            <div className="space-y-3 pt-1">
              <div className="text-xs text-gray-600 leading-relaxed">
                Connect the Google Sheet linked to your Google Form. In Google Forms, click <strong>Responses &gt; Link to Sheets</strong>. Make sure sheet sharing is set to <em>"Anyone with the link can view"</em>, paste the link here, and click <strong>Sync Responses Now</strong>.
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                  className="flex-1 border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                />
                <button
                  type="button"
                  disabled={isSyncingSheet}
                  onClick={handleSyncSheet}
                  className="bg-[#0b1957] hover:bg-[#101d6b] disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSheet ? 'Syncing...' : 'Sync Responses Now'}</span>
                </button>
              </div>

              {syncStatus && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium border ${
                    syncStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {syncStatus.message}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE RESPONSE SIMULATOR */}
          {activeTab === 'simulate' && (
            <form onSubmit={handleSubmitSimulator} className="space-y-3 pt-1 text-xs">
              <p className="text-gray-600">
                Instantly simulate or record a guest answering the Google Form. All submitted responses will appear immediately on the guest list and automatically increment the Confirmed, Declined, or Pending counts:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Guest Full Name *</label>
                  <input
                    type="text"
                    required
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Guest Email</label>
                  <input
                    type="email"
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    placeholder="e.g. maria.santos@gmail.com"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Google Form RSVP Choice *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimRsvp('Confirmed')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      simRsvp === 'Confirmed'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimRsvp('Declined')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      simRsvp === 'Declined'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Declined</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimRsvp('Pending')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      simRsvp === 'Pending'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Notes / Message (Optional)</label>
                <input
                  type="text"
                  value={simNotes}
                  onChange={(e) => setSimNotes(e.target.value)}
                  placeholder="e.g. Vegetarian meal requested"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingSim || !simName.trim()}
                  className="bg-[#0b1957] hover:bg-[#101d6b] disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmittingSim ? 'Submitting...' : 'Submit Form Response to Guest List'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: AUTOMATED WEBHOOK SCRIPT */}
          {activeTab === 'webhook' && (
            <div className="space-y-3 pt-1 text-xs">
              <p className="text-gray-600 leading-relaxed">
                Automatically push every submission from your Google Form directly to this event using Google Apps Script:
              </p>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Webhook URL for this Event</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono select-all text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      setCopiedWebhook(true);
                      setTimeout(() => setCopiedWebhook(false), 2000);
                      onToast('Webhook URL copied!');
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-semibold flex items-center gap-1 border border-gray-300 cursor-pointer"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Google Apps Script snippet (Paste into Google Form &gt; Script editor):</label>
                <pre className="bg-gray-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
{`function onFormSubmit(e) {
  var url = "${webhookUrl}";
  var responses = e.response.getItemResponses();
  var name = responses[0] ? responses[0].getResponse() : "";
  var email = e.response.getRespondentEmail() || (responses[1] ? responses[1].getResponse() : "");
  var rsvp = responses[2] ? responses[2].getResponse() : "Confirmed";
  
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ name: name, email: email, rsvp: rsvp })
  });
}`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: PASTE CSV */}
          {activeTab === 'paste' && (
            <div className="space-y-3 pt-1 text-xs">
              <p className="text-gray-600">
                Paste responses downloaded or copied from your Google Form:
              </p>
              <textarea
                rows={5}
                value={pasteRows}
                onChange={(e) => setPasteRows(e.target.value)}
                placeholder={`Name,Email,Status\nJuan Dela Cruz,juan@example.com,Confirmed\nAna Ramos,ana@example.com,Declined\nPedro Penduko,pedro@example.com,Pending`}
                className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleImportPaste}
                  disabled={!pasteRows.trim()}
                  className="bg-[#0b1957] hover:bg-[#101d6b] disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Import Pasted Responses
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t pt-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#0b1957] hover:bg-[#101d6b] text-white px-6 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. PUBLIC GUEST RSVP CONFIRMATION PAGE
// (Rendered when anyone opens ?rsvp=... in Google Chrome)
// ==========================================

function PublicGuestRsvpPage({
  event,
  eventId,
  onRsvpSubmitted,
  onExitToOrganizer
}: {
  event: EventItem | null;
  eventId: string;
  onRsvpSubmitted: (guestName: string, guestEmail: string, rsvp: RSVPStatus, notes?: string) => void;
  onExitToOrganizer: () => void;
}) {
  const [currentEvent, setCurrentEvent] = useState<EventItem | null>(event);
  const [loadingEvent, setLoadingEvent] = useState<boolean>(!event);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [rsvpChoice, setRsvpChoice] = useState<RSVPStatus>('Confirmed');
  const [companions, setCompanions] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    email: string;
    choice: RSVPStatus;
    companions?: number;
    notes?: string;
  } | null>(null);

  // If event is not provided in local state (e.g. guest opened on phone/laptop), fetch from backend server
  useEffect(() => {
    if (!currentEvent && eventId) {
      setLoadingEvent(true);
      fetch(`/api/events/${eventId}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data && data.title) {
            setCurrentEvent(data);
          }
          setLoadingEvent(false);
        })
        .catch(() => setLoadingEvent(false));
    }
  }, [eventId, currentEvent]);

  useEffect(() => {
    if (event) {
      setCurrentEvent(event);
      setLoadingEvent(false);
    }
  }, [event]);

  // Auto-fill existing guest details if known
  useEffect(() => {
    if (currentEvent && guestEmail.trim() && currentEvent.guests) {
      const match = currentEvent.guests.find(g => g.email.toLowerCase() === guestEmail.trim().toLowerCase());
      if (match && !guestName) {
        setGuestName(match.name);
        setRsvpChoice(match.rsvp);
      }
    }
  }, [guestEmail, currentEvent, guestName]);

  const displayEvent = currentEvent || {
    id: eventId,
    title: 'Event RSVP Confirmation',
    desc: 'Please confirm your attendance for our upcoming event.',
    date: 'Upcoming Date',
    time: '9:00 am',
    location: 'Main Venue',
    month_display: '',
    day_display: '',
    max_guests: 50,
    rsvp_count: 0,
    status: 'Upcoming' as EventStatus,
    rsvp_link: '',
    guests: []
  };

  const category = getEventCategory(displayEvent.title, displayEvent.desc);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail) return;
    setSubmitting(true);
    try {
      const fullNotes = companions > 0
        ? `[+${companions} Companion${companions > 1 ? 's' : ''}] ${notes}`.trim()
        : notes.trim();
      await onRsvpSubmitted(guestName.trim(), guestEmail.trim(), rsvpChoice, fullNotes);
      setSubmittedData({
        name: guestName.trim(),
        email: guestEmail.trim(),
        choice: rsvpChoice,
        companions,
        notes: notes.trim()
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0ebf8] py-8 px-4 font-sans flex flex-col items-center justify-start">
      <div className="w-full max-w-xl space-y-4">
        {/* Google Forms Top Bar */}
        <div className="flex items-center justify-between px-2 text-xs text-gray-600 mb-1">
          <div className="flex items-center gap-1.5 font-bold text-[#673ab7]">
            <FileText className="w-4 h-4" />
            <span>Google Forms • {category.name}</span>
          </div>
          <button
            onClick={onExitToOrganizer}
            className="text-[11px] text-gray-500 hover:text-black underline cursor-pointer"
          >
            Organizer Login
          </button>
        </div>

        {loadingEvent ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200 space-y-3">
            <div className="w-10 h-10 border-4 border-[#673ab7] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-gray-600">Loading Google Form RSVP for {displayEvent.title}...</p>
          </div>
        ) : submitted ? (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 font-sans">
              Your response has been recorded!
            </h2>
            <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
              Thank you for responding to <strong>{displayEvent.title}</strong>. Your confirmation status has been synced directly to the event host's guest list.
            </p>

            {/* Submission summary receipt */}
            {submittedData && (
              <div className="bg-purple-50/60 rounded-xl p-4 text-left text-xs space-y-1.5 border border-purple-100 max-w-md mx-auto">
                <div className="font-bold text-[#673ab7] pb-1 border-b border-purple-200 flex items-center justify-between">
                  <span>Response Summary</span>
                  <span>{category.icon} {category.name}</span>
                </div>
                <div>👤 <strong>Name:</strong> {submittedData.name}</div>
                <div>✉️ <strong>Email:</strong> {submittedData.email}</div>
                <div>
                  📋 <strong>RSVP Status:</strong>{' '}
                  <span className={`font-bold ${submittedData.choice === 'Confirmed' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {submittedData.choice === 'Confirmed' ? category.confirmText : category.declineText}
                  </span>
                </div>
                {submittedData.companions !== undefined && submittedData.companions > 0 && (
                  <div>👥 <strong>Companions:</strong> +{submittedData.companions} additional guest{submittedData.companions > 1 ? 's' : ''}</div>
                )}
                {submittedData.notes && <div>💬 <strong>Notes:</strong> {submittedData.notes}</div>}
              </div>
            )}

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setGuestName('');
                  setGuestEmail('');
                  setCompanions(0);
                  setNotes('');
                }}
                className="text-xs text-[#673ab7] hover:underline font-semibold cursor-pointer"
              >
                Submit another response
              </button>
              <button
                type="button"
                onClick={onExitToOrganizer}
                className="bg-[#673ab7] hover:bg-[#5e35b1] text-white text-xs px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors cursor-pointer"
              >
                Return to EManage
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header Event Card with Dynamic Category Banner */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className={`bg-gradient-to-r ${category.bannerGradient} p-6 text-white`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-xs">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </span>
                  <span className="text-[11px] font-medium text-white/80">Google Forms RSVP</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight">
                  {displayEvent.title}
                </h1>
              </div>

              <div className="p-6">
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  {displayEvent.desc || 'Please confirm your attendance for our upcoming event.'}
                </p>
                <div className="text-xs text-gray-700 space-y-1.5 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>📅 <strong>Date:</strong> {displayEvent.date}</div>
                  <div>🕒 <strong>Time:</strong> {displayEvent.time}</div>
                  <div>📍 <strong>Location:</strong> {displayEvent.location}</div>
                  <div>🏷️ <strong>Event Type:</strong> <span className="font-semibold text-gray-900">{category.name}</span></div>
                </div>
              </div>
            </div>

            {/* Field: Full Name */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-gray-500 mb-3">Please provide your complete name.</p>
              <input
                type="text"
                required
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Your answer"
                className="w-full border-b-2 border-gray-300 focus:border-[#673ab7] py-2 text-xs focus:outline-none bg-transparent"
              />
            </div>

            {/* Field: Email */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Your Email Address <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-gray-500 mb-3">Confirmation and event updates will be verified with this email.</p>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                placeholder="Your email (e.g. name@example.com)"
                className="w-full border-b-2 border-gray-300 focus:border-[#673ab7] py-2 text-xs focus:outline-none bg-transparent"
              />
            </div>

            {/* Field: Attendance (Dynamically adapted to event category) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-1">
                {category.attendanceQuestion} <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3 mt-3 text-xs">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 hover:bg-emerald-50/40 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="publicRsvpChoice"
                    value="Confirmed"
                    checked={rsvpChoice === 'Confirmed'}
                    onChange={() => setRsvpChoice('Confirmed')}
                    className="w-4 h-4 mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-emerald-800 text-sm block">{category.confirmText}</span>
                    <span className="text-[11px] text-gray-500">{category.confirmDesc}</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 hover:bg-rose-50/40 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="publicRsvpChoice"
                    value="Declined"
                    checked={rsvpChoice === 'Declined'}
                    onChange={() => setRsvpChoice('Declined')}
                    className="w-4 h-4 mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-rose-800 text-sm block">{category.declineText}</span>
                    <span className="text-[11px] text-gray-500">{category.declineDesc}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Field: Companions / Plus-ones */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-1">
                {category.companionLabel} (Optional)
              </label>
              <p className="text-[11px] text-gray-500 mb-3">
                Indicate how many additional companions or delegates will be accompanying you (0 if attending solo).
              </p>
              <input
                type="number"
                min={0}
                max={20}
                value={companions}
                onChange={e => setCompanions(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            {/* Field: Special Notes / Wishes (Dynamically adapted) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-1">
                {category.notesLabel} (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={category.notesPlaceholder}
                className="w-full border-b-2 border-gray-300 focus:border-[#673ab7] py-2 text-xs focus:outline-none resize-none bg-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={submitting}
                className={`bg-gradient-to-r ${category.bannerGradient} hover:opacity-95 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer`}
              >
                {submitting ? 'Submitting Response...' : 'Submit Response'}
              </button>
              <span className="text-[11px] text-gray-500">Never submit passwords through Google Forms.</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 8. GOOGLE FORM RSVP MODAL (In-App Preview)
// ==========================================

function GoogleFormRsvpModal({
  event,
  onClose,
  onRsvpSubmitted
}: {
  event: EventItem;
  onClose: () => void;
  onRsvpSubmitted: (guestName: string, guestEmail: string, rsvp: RSVPStatus, notes?: string) => void;
}) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [rsvpChoice, setRsvpChoice] = useState<RSVPStatus>('Confirmed');
  const [companions, setCompanions] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const realRsvpUrl = getEventRsvpWebUrl(event.id, event);
  const category = getEventCategory(event.title, event.desc);

  useEffect(() => {
    if (guestEmail.trim()) {
      const match = event.guests.find(g => g.email.toLowerCase() === guestEmail.trim().toLowerCase());
      if (match && !guestName) {
        setGuestName(match.name);
        setRsvpChoice(match.rsvp);
      }
    }
  }, [guestEmail, event.guests, guestName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail) return;
    const fullNotes = companions > 0
      ? `[+${companions} Companion${companions > 1 ? 's' : ''}] ${notes}`.trim()
      : notes.trim();
    onRsvpSubmitted(guestName.trim(), guestEmail.trim(), rsvpChoice, fullNotes);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in">
      <div className="bg-[#f0ebf8] rounded-2xl w-full max-w-xl my-8 overflow-hidden shadow-2xl border border-purple-200">
        {/* Google Form Top Bar Header with Dynamic Category Gradient */}
        <div className={`bg-gradient-to-r ${category.bannerGradient} text-white px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-lg">
              {category.icon}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/80 font-bold flex items-center gap-1.5">
                <span>{category.name}</span>
                <span>•</span>
                <span>Google Forms RSVP</span>
              </div>
              <div className="text-sm font-bold truncate max-w-md">{event.title}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 bg-white m-4 rounded-xl shadow-xs text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-sans">
              Your response has been recorded!
            </h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
              Thank you for responding to <strong>{event.title}</strong>. Your confirmation status (<span className="font-bold text-[#673ab7]">{rsvpChoice === 'Confirmed' ? category.confirmText : category.declineText}</span>) has been synced directly to the guest list and attendance count.
            </p>
            {companions > 0 && (
              <div className="text-xs text-gray-700 bg-gray-50 py-2 px-3 rounded-lg border border-gray-100 inline-block">
                👥 Registered with +{companions} companion{companions > 1 ? 's' : ''}
              </div>
            )}
            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setGuestName('');
                  setGuestEmail('');
                  setCompanions(0);
                  setNotes('');
                }}
                className="text-xs text-[#673ab7] hover:underline font-semibold cursor-pointer"
              >
                Submit another response
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`bg-gradient-to-r ${category.bannerGradient} text-white text-xs px-5 py-2.5 rounded-lg font-medium shadow-sm transition-opacity hover:opacity-90 cursor-pointer`}
              >
                Close Form
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Form Info Card */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              <div className={`bg-gradient-to-r ${category.bannerGradient} p-5 text-white`}>
                <div className="flex items-center gap-1.5 text-xs font-bold mb-1 opacity-90">
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </div>
                <h2 className="text-2xl font-bold font-sans">
                  {event.title}
                </h2>
              </div>
              <div className="p-5">
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  {event.desc || 'Please confirm your attendance for our upcoming event.'}
                </p>
                <div className="text-xs text-gray-500 space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div>📅 <strong>Date &amp; Time:</strong> {event.date} at {event.time}</div>
                  <div>📍 <strong>Location:</strong> {event.location}</div>
                  <div>🔗 <strong>Direct Public Form Link:</strong> <span className="font-mono text-[11px] text-[#673ab7] break-all">{realRsvpUrl}</span></div>
                </div>
              </div>
            </div>

            {/* Question 1: Name */}
            <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-gray-500 mb-2">Please provide your complete name as it appears on the guest list.</p>
              <input
                type="text"
                required
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Your answer"
                className="w-full border-b-2 border-gray-300 focus:border-[#673ab7] py-2 text-xs focus:outline-none"
              />
            </div>

            {/* Question 2: Email */}
            <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-gray-500 mb-2">We will link your response to your guest invitation record.</p>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                placeholder="Your email (e.g. name@example.com)"
                className="w-full border-b-2 border-gray-300 focus:border-[#673ab7] py-2 text-xs focus:outline-none"
              />
            </div>

            {/* Question 3: RSVP Radio Choice (Tailored to Event Category) */}
            <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-1">
                {category.attendanceQuestion} <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3 mt-3 text-xs">
                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-emerald-50/40 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="rsvpStatusOption"
                    value="Confirmed"
                    checked={rsvpChoice === 'Confirmed'}
                    onChange={() => setRsvpChoice('Confirmed')}
                    className="w-4 h-4 mt-0.5 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-emerald-800 block">{category.confirmText}</span>
                    <span className="text-[11px] text-gray-500">{category.confirmDesc}</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-rose-50/40 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="rsvpStatusOption"
                    value="Declined"
                    checked={rsvpChoice === 'Declined'}
                    onChange={() => setRsvpChoice('Declined')}
                    className="w-4 h-4 mt-0.5 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-rose-800 block">{category.declineText}</span>
                    <span className="text-[11px] text-gray-500">{category.declineDesc}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Question 4: Companions / Plus-ones */}
            <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-1">
                {category.companionLabel} (Optional)
              </label>
              <p className="text-[11px] text-gray-500 mb-2">
                Number of guests attending alongside you (0 if attending alone).
              </p>
              <input
                type="number"
                min={0}
                max={20}
                value={companions}
                onChange={e => setCompanions(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            {/* Question 5: Dietary / Message */}
            <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-1">
                {category.notesLabel} (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={category.notesPlaceholder}
                className="w-full border-b-2 border-gray-300 focus:border-[#673ab7] py-2 text-xs focus:outline-none resize-none"
              />
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className={`bg-gradient-to-r ${category.bannerGradient} hover:opacity-95 text-white px-8 py-2.5 rounded-lg font-bold text-xs shadow-md transition-opacity cursor-pointer`}
              >
                Submit Response
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-black font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 9. BROADCAST EMAIL & GMAIL MODAL
// ==========================================

function BroadcastEmailsModal({
  event,
  onClose,
  onBroadcastComplete
}: {
  event: EventItem;
  onClose: () => void;
  onBroadcastComplete: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'qr'>('email');
  const [copiedNotice, setCopiedNotice] = useState(false);
  const totalGuests = event.guests.length;
  const validEmailGuests = event.guests.filter(g => g.email && g.email.includes('@'));
  const guestEmails = validEmailGuests.map(g => g.email);
  // Always use the uploaded / saved RSVP link for this event
  const rawUploadedLink = (event.rsvp_link && event.rsvp_link.trim().length > 0)
    ? event.rsvp_link.trim()
    : DEFAULT_GFORM_RSVP_URL;
  const realRsvpUrl = rawUploadedLink.startsWith('http://') || rawUploadedLink.startsWith('https://')
    ? rawUploadedLink
    : `https://${rawUploadedLink}`;

  const emailSubject = `RSVP Invitation: ${event.title}`;
  const emailBody = `Dear Guest,\n\nYou are cordially invited to attend ${event.title}!\n\n📅 Date & Time: ${event.date} at ${event.time}\n📍 Location: ${event.location}\n\nPlease submit your RSVP response using this link:\n${realRsvpUrl}\n\nWe look forward to celebrating with you!\nWarm regards,\nEManage Host`;

  const gmailUrl = createGmailComposeUrl(guestEmails, emailSubject, emailBody);
  const mailtoUrl = createMailtoUrl(guestEmails, emailSubject, emailBody);

  const handleSimulatedBroadcast = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onBroadcastComplete();
    }, 1200);
  };

  const copyEmailText = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-[#0b1957]">Send RSVP Link to All Guests</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Send via Email / Gmail vs Scan on Cellphone */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'email' ? 'bg-white text-[#0b1957] shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send to Guest Emails</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'qr' ? 'bg-white text-[#0b1957] shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Scan on Mobile (QR)</span>
          </button>
        </div>

        {activeTab === 'qr' ? (
          <div className="text-center space-y-3 py-2">
            <p className="text-xs text-gray-600">
              Open your cellphone camera and scan this QR code to test the live Google Form RSVP confirmation on your phone:
            </p>
            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 inline-block mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(realRsvpUrl)}`}
                alt="Mobile RSVP QR"
                className="w-44 h-44 mx-auto rounded-lg shadow-xs"
              />
            </div>
            <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-200 break-all text-left font-mono">
              {realRsvpUrl}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(realRsvpUrl);
                  setCopiedNotice(true);
                  setTimeout(() => setCopiedNotice(false), 2500);
                }}
                className="flex-1 bg-[#0b1957] hover:bg-[#101d6b] text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedNotice ? 'Copied URL!' : 'Copy Public Link'}</span>
              </button>
              <a
                href={realRsvpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-purple-300 text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
            </div>
          </div>
        ) : totalGuests === 0 ? (
          <div className="py-8 text-center text-gray-500 space-y-2">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="text-xs font-semibold">No guests found in this event.</p>
            <p className="text-[11px] text-gray-400">Please add guests or import a CSV guest list before broadcasting.</p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-2 border rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-emerald-800">
              <div className="font-bold text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Ready to deliver to {validEmailGuests.length} guest email{validEmailGuests.length === 1 ? '' : 's'}
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                Guests can open the link directly in Google Chrome on cellphones and laptops without logging in.
              </div>
            </div>

            <div className="bg-[#fffdf6] border border-[#eee5d6] rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#0b1957]" />
                  <span>Uploaded RSVP Link Being Sent:</span>
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                  {realRsvpUrl.includes('forms.gle') || realRsvpUrl.includes('google.com/forms') ? 'Uploaded Google Form' : 'Uploaded Link'}
                </span>
              </div>
              <div className="font-mono text-[11px] text-[#0b1957] break-all select-all font-semibold bg-white p-2 rounded-lg border border-gray-200">
                {realRsvpUrl}
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Email Subject</label>
              <input
                readOnly
                value={emailSubject}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 font-medium text-gray-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Email Message Preview</label>
              <div className="w-full bg-[#fffdf6] border border-gray-300 rounded-xl p-3 text-[11px] text-gray-700 space-y-2 font-sans max-h-36 overflow-y-auto">
                <p>Dear Guest,</p>
                <p>You are cordially invited to attend <strong>{event.title}</strong>!</p>
                <p>📅 <strong>Date &amp; Time:</strong> {event.date} at {event.time}<br />📍 <strong>Location:</strong> {event.location}</p>
                <p>Please submit your RSVP response by opening this official link:</p>
                <p className="font-mono text-[#0b1957] font-semibold bg-blue-50 p-1.5 rounded break-all">{realRsvpUrl}</p>
                <p>Warm regards,<br />EManage Event Team</p>
              </div>
            </div>

            {copiedNotice && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-lg text-center text-xs font-semibold">
                ✅ Email invitation text copied to clipboard!
              </div>
            )}

            {/* Direct Send Buttons (Gmail & Mailto) */}
            <div className="pt-2 border-t space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Send via Gmail Web in Chrome */}
                <a
                  href={gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onBroadcastComplete()}
                  className="bg-red-600 hover:bg-red-700 text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm text-center transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Open in Gmail Web</span>
                </a>

                {/* Send via Default Mail Client */}
                <a
                  href={mailtoUrl}
                  onClick={() => onBroadcastComplete()}
                  className="bg-gray-800 hover:bg-black text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm text-center transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Open in Default Mail</span>
                </a>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={copyEmailText}
                  className="text-xs text-gray-600 hover:text-black font-semibold underline cursor-pointer"
                >
                  Copy Full Invitation Text
                </button>

                <button
                  type="button"
                  onClick={handleSimulatedBroadcast}
                  disabled={sending}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  {sending ? 'Broadcasting...' : 'Mark All as Sent & Invited'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 10. PROFILE PAGE (Finished from 1st file)
// ==========================================
function ProfilePage({
  user,
  eventsCount,
  totalGuestsCount,
  onSaveUser,
  onClearAllEvents,
  onLoadSampleEvent,
  onExportJson,
  onLogout
}: {
  user: User;
  eventsCount: number;
  totalGuestsCount: number;
  onSaveUser: (updatedUser: User) => void;
  onClearAllEvents: () => void;
  onLoadSampleEvent: () => void;
  onExportJson: () => void;
  onLogout: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '+63 912 345 6789');
  const [role, setRole] = useState(user.role || 'Event Coordinator & Admin');
  const [organization, setOrganization] = useState(user.organization || 'EManage Events Studio');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConPass, setShowConPass] = useState(false);

  const [profileError, setProfileError] = useState<string | null>(null);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    if (!name || !email) return;

    let updatedPassword = user.password;
    if (newPassword) {
      if (oldPassword !== user.password) {
        setProfileError('Current password does not match!');
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileError('New passwords do not match!');
        return;
      }
      updatedPassword = newPassword;
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    onSaveUser({
      ...user,
      name,
      email,
      phone,
      role,
      organization,
      password: updatedPassword
    });
  };

  return (
    <div className="p-7 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold font-sans text-[#0b1957] tracking-tight">
          User Profile &amp; Settings
        </h1>
        <p className="text-xs text-[#5a5a55] mt-0.5">
          Manage your account credentials, event administrative profile, and system settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Overview */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="relative inline-block mx-auto mb-4">
              <div className="w-24 h-24 rounded-full bg-[#0b1957] text-[#f7f4ed] text-4xl font-bold flex items-center justify-center font-serif shadow-md border-4 border-[#fffdf6]">
                {name.charAt(0)}
              </div>
              <div className="absolute bottom-0 right-0 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white" title="Active" />
            </div>

            <h2 className="text-lg font-bold text-gray-900">{name}</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{email}</p>
            <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0b1957] border border-blue-100">
              {role}
            </span>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 mt-6 pt-5 border-t border-gray-100 text-center">
              <div className="bg-gray-50 p-3 rounded-xl">
                <div className="text-xl font-extrabold text-[#0b1957]">{eventsCount}</div>
                <div className="text-[11px] text-gray-500">Events Managed</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <div className="text-xl font-extrabold text-[#0b1957]">{totalGuestsCount}</div>
                <div className="text-[11px] text-gray-500">Total Guests</div>
              </div>
            </div>
          </div>

          {/* Database System Tools */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#0b1957]" />
              System &amp; Database Actions
            </h3>



            <button
              onClick={onLoadSampleEvent}
              className="w-full py-2 px-3 border border-indigo-200 bg-indigo-50/50 rounded-xl text-xs font-medium text-[#0b1957] hover:bg-indigo-100 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Load Sample Wedding Event</span>
              <Sparkles className="w-3.5 h-3.5 text-[#0b1957]" />
            </button>

            <button
              onClick={onClearAllEvents}
              className="w-full py-2 px-3 border border-rose-200 bg-rose-50/50 rounded-xl text-xs font-medium text-rose-700 hover:bg-rose-100 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Clear All Events (Clean Slate)</span>
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            </button>

            <button
              onClick={onExportJson}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Download DB Backup (JSON)</span>
              <Download className="w-3.5 h-3.5 text-gray-500" />
            </button>

            <button
              onClick={onLogout}
              className="w-full py-2 px-3 bg-[#0b1957] text-white rounded-xl text-xs font-medium hover:bg-[#101d6b] flex items-center justify-between transition-colors shadow-sm cursor-pointer"
            >
              <span>Sign Out of Account</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Edit Profile & Password Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleProfileSave} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-[#0b1957] border-b pb-3">
              Personal Information
            </h3>

            {profileError && (
              <div className="bg-rose-50 text-rose-700 p-2.5 rounded-xl border border-rose-200 text-xs font-semibold">
                {profileError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-gray-300 pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-gray-300 pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full border border-gray-300 pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Job Title / Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-gray-700 mb-1">Organization / Event Studio</label>
                <input
                  type="text"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                />
              </div>
            </div>

            {/* Change Password Section */}
            <h3 className="text-base font-bold text-[#0b1957] border-b pb-3 pt-3">
              Change Password
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    placeholder="Enter current password to verify"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="w-full border border-gray-300 pr-10 pl-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base select-none cursor-pointer"
                  >
                    {showOldPass ? '🙈' : '🙉'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full border border-gray-300 pr-10 pl-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-base select-none cursor-pointer"
                    >
                      {showNewPass ? '🙈' : '🙉'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConPass ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full border border-gray-300 pr-10 pl-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConPass(!showConPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-base select-none cursor-pointer"
                    >
                      {showConPass ? '🙈' : '🙉'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <h3 className="text-base font-bold text-[#0b1957] border-b pb-3 pt-3">
              System Preferences
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <div>
                  <span className="font-semibold text-gray-800 block">Email alerts on new RSVP responses</span>
                  <span className="text-gray-500 text-[11px]">Receive instantaneous notifications when guests respond</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={e => setEmailNotifs(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0b1957] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <div>
                  <span className="font-semibold text-gray-800 block">Attendance tracker sound cues</span>
                  <span className="text-gray-500 text-[11px]">Provide audio feedback when check-in status changes</span>
                </div>
                <input
                  type="checkbox"
                  checked={attendanceAlerts}
                  onChange={e => setAttendanceAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0b1957] cursor-pointer"
                />
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                className="bg-[#0b1957] hover:bg-[#101d6b] text-white px-6 py-2.5 rounded-xl font-medium text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 11. EVENT CREATE / EDIT MODAL
// ==========================================

function EventFormModal({
  initialData,
  onClose,
  onSave
}: {
  initialData: EventItem | null;
  onClose: () => void;
  onSave: (data: Partial<EventItem> & { title: string; date: string; time: string; max_guests: number }) => void;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [date, setDate] = useState(initialData?.date || '2026-10-05');
  const [time, setTime] = useState(initialData?.time || '9:00 am');
  const [location, setLocation] = useState(initialData?.location || 'Tagaytay');
  const [desc, setDesc] = useState(initialData?.desc || '');
  const [maxGuests, setMaxGuests] = useState(initialData?.max_guests?.toString() || '50');
  const [status, setStatus] = useState<EventStatus>(initialData?.status || 'Upcoming');
  const [rsvpLink, setRsvpLink] = useState(initialData?.rsvp_link || DEFAULT_GFORM_RSVP_URL);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;

    onSave({
      title,
      date,
      time,
      location,
      desc,
      max_guests: parseInt(maxGuests, 10) || 50,
      status,
      rsvp_link: rsvpLink.trim() || DEFAULT_GFORM_RSVP_URL
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <h3 className="font-bold text-base text-[#0b1957]">
            {initialData ? 'Edit Event' : 'Create New Event'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Event Name</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Jane & Francis Wedding"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Event Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Event Time</label>
              <input
                type="text"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                placeholder="e.g. 9:00 am or 14:00"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Tagaytay"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Max Guests</label>
              <input
                type="number"
                min="1"
                required
                value={maxGuests}
                onChange={e => setMaxGuests(e.target.value)}
                placeholder="e.g. 50"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Brief description of the event..."
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Event Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as EventStatus)}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none cursor-pointer"
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Google Form / Uploaded RSVP Link
            </label>
            <input
              type="text"
              value={rsvpLink}
              onChange={e => setRsvpLink(e.target.value)}
              placeholder="e.g. https://forms.gle/aFGNLexpupZkvvpr8"
              className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#0b1957]"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">
              This uploaded link will be delivered when you click &quot;Send RSVP Link to All Guests&quot; and copied via &quot;Copy Link&quot;.
            </span>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-purple-900 text-[11px] flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-700 shrink-0" />
            <span>
              Your uploaded <strong>Google Form RSVP Link</strong> will be delivered to all guest emails and openable in Google Chrome on mobile phones and laptops!
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#0b1957] hover:bg-[#101d6b] text-white px-5 py-2 rounded-lg font-medium shadow cursor-pointer"
            >
              {initialData ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 12. AUTHENTICATION SCREENS (from main.py, login.py, signup.py)
// ==========================================

function LoginForm({
  onLogin,
  onNavigate,
  registeredUsers
}: {
  onLogin: (user: User) => void;
  onNavigate: (view: 'signup' | 'forgot') => void;
  registeredUsers: User[];
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(3);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    const found = registeredUsers.find(
      u => (u.email.toLowerCase() === email.toLowerCase() || u.name.toLowerCase() === email.toLowerCase()) &&
           u.password === password
    );

    if (found) {
      onLogin(found);
      return;
    }

    // Also check server for users who signed up on phone or another device
    fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          onLogin(data.user);
        } else {
          const left = attempts - 1;
          setAttempts(left);
          if (left <= 0) {
            setErrorMsg('Too many failed attempts! Account temporarily locked.');
          } else {
            setErrorMsg('Invalid credentials! Please check your email and password, or create an account via Sign Up.');
          }
        }
      })
      .catch(() => {
        const left = attempts - 1;
        setAttempts(left);
        if (left <= 0) {
          setErrorMsg('Too many failed attempts! Account temporarily locked.');
        } else {
          setErrorMsg('Invalid credentials! Please check your credentials or create an account via Sign Up.');
        }
      });
    return;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold font-serif text-[#0b1957]">Log In to EManage</h2>
        <p className="text-xs text-gray-500 mt-1">Access your event dashboard and guest trackers</p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address or Username</label>
        <input
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="e.g. name@example.com"
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0b1957] bg-white"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-700">Password</label>
          <button
            type="button"
            onClick={() => onNavigate('forgot')}
            className="text-[11px] text-[#0b1957] hover:underline cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-[#0b1957] bg-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-base select-none cursor-pointer"
          >
            {showPassword ? '🙈' : '🙉'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={attempts <= 0}
        className="w-full bg-[#0b1957] hover:bg-[#101d6b] disabled:bg-gray-400 text-[#f7f4ed] py-3 rounded-full font-semibold text-xs shadow-md transition-colors mt-2 cursor-pointer"
      >
        Log In
      </button>

      <div className="text-center text-xs text-gray-600 pt-2">
        New here?{' '}
        <button
          type="button"
          onClick={() => onNavigate('signup')}
          className="font-bold text-[#0b1957] hover:underline cursor-pointer"
        >
          Create an account (Sign Up)
        </button>
      </div>
    </form>
  );
}

function SignupForm({
  onSignup,
  onNavigate
}: {
  onSignup: (user: User) => void;
  onNavigate: (view: 'login') => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    const emailPattern = /^[\w.-]+@[\w.-]+\.\w+$/;
    if (!emailPattern.test(email)) {
      setErrorMsg('Invalid email format');
      return;
    }
    if (!agreed) {
      setErrorMsg('You must agree to the Terms and Conditions');
      return;
    }

    const newUser: User = {
      id: Date.now(),
      name,
      email,
      password,
      role: 'Event Host & Admin',
      phone: '',
      organization: 'Personal Workspace',
      createdAt: 'October 2026'
    };
    onSignup(newUser);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold font-serif text-[#0b1957]">Create New Account</h2>
        <p className="text-xs text-gray-500 mt-1">Start fresh with your own empty dashboard and events</p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Maria Santos"
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0b1957] bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0b1957] bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Create a password"
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-[#0b1957] bg-white"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-base select-none cursor-pointer"
          >
            {showPass ? '🙈' : '🙉'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="termsCheck"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="w-4 h-4 rounded text-[#0b1957] cursor-pointer"
        />
        <label htmlFor="termsCheck" className="text-xs text-gray-600 cursor-pointer">
          I agree to the <span className="text-[#0b1957] font-semibold underline">Terms and Conditions</span>
        </label>
      </div>

      <button
        type="submit"
        className="w-full bg-[#0b1957] hover:bg-[#101d6b] text-[#f7f4ed] py-3 rounded-full font-semibold text-xs shadow-md transition-colors mt-2 cursor-pointer"
      >
        Sign Up &amp; Open Dashboard
      </button>

      <div className="text-center text-xs text-gray-600 pt-2">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="font-bold text-[#0b1957] hover:underline cursor-pointer"
        >
          Log in
        </button>
      </div>
    </form>
  );
}

function ForgotPasswordForm({
  onNavigate,
  onCodeSent
}: {
  onNavigate: (view: 'login') => void;
  onCodeSent: () => void;
}) {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email');
      return;
    }
    const pattern = /^[\w.-]+@[\w.-]+\.\w+$/;
    if (!pattern.test(email)) {
      setErrorMsg('Invalid email format');
      return;
    }
    onCodeSent();
  };

  return (
    <form onSubmit={handleSend} className="space-y-4">
      <button
        type="button"
        onClick={() => onNavigate('login')}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:text-black mb-2 cursor-pointer"
      >
        &lt;
      </button>

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold font-serif text-[#0b1957]">Forgot Password</h2>
        <p className="text-xs text-gray-500 mt-1">Enter your registered email to receive a password reset code</p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0b1957] bg-white"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-[#0b1957] hover:bg-[#101d6b] text-[#f7f4ed] py-3 rounded-full font-semibold text-xs shadow-md transition-colors mt-2 cursor-pointer"
      >
        Verify Email
      </button>
    </form>
  );
}

function VerifyEmailForm({
  onNavigate,
  onVerified
}: {
  onNavigate: (view: 'login' | 'forgot') => void;
  onVerified: () => void;
}) {
  const [code, setCode] = useState(['4', '8', '2', '9']);

  const [resentMsg, setResentMsg] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    onVerified();
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <button
        type="button"
        onClick={() => onNavigate('forgot')}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:text-black mb-2 cursor-pointer"
      >
        &lt;
      </button>

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold font-serif text-[#0b1957]">Verify Email</h2>
        <p className="text-xs text-gray-500 mt-1">Enter the 4-digit verification code sent to your email</p>
      </div>

      <div className="flex justify-center gap-3 my-6">
        {[0, 1, 2, 3].map((i) => (
          <input
            key={i}
            type="text"
            maxLength={1}
            value={code[i] || ''}
            onChange={(e) => {
              const val = e.target.value;
              const next = [...code];
              next[i] = val;
              setCode(next);
            }}
            className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-[#0b1957] focus:outline-none bg-white"
          />
        ))}
      </div>

      <button
        type="submit"
        className="w-full bg-[#0b1957] hover:bg-[#101d6b] text-[#f7f4ed] py-3 rounded-full font-semibold text-xs shadow-md transition-colors cursor-pointer"
      >
        Verify Code
      </button>

      {resentMsg && (
        <div className="text-center text-xs font-semibold text-emerald-700 bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">
          Verification code resent to your email!
        </div>
      )}

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => {
            setResentMsg(true);
            setTimeout(() => setResentMsg(false), 3000);
          }}
          className="text-xs font-semibold text-[#0b1957] border border-[#0b1957] hover:bg-[#0b1957] hover:text-[#f7f4ed] px-4 py-1.5 rounded-full transition-colors cursor-pointer"
        >
          Resend Code
        </button>
      </div>
    </form>
  );
}

function CreateNewPasswordForm({
  onNavigate,
  onSaved
}: {
  onNavigate: (view: 'login') => void;
  onSaved: (pass: string) => void;
}) {
  const [newPass, setNewPass] = useState('');
  const [conPass, setConPass] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || !conPass) {
      setErrorMsg('Please fill in both fields');
      return;
    }
    if (newPass !== conPass) {
      setErrorMsg('Passwords do not match');
      return;
    }
    onSaved(newPass);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <button
        type="button"
        onClick={() => onNavigate('login')}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:text-black mb-2 cursor-pointer"
      >
        &lt;
      </button>

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold font-serif text-[#0b1957]">Create New Password</h2>
        <p className="text-xs text-gray-500 mt-1">Set a secure new password for your account</p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            placeholder="Enter new password"
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-[#0b1957] bg-white"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-base select-none cursor-pointer"
          >
            {showNew ? '🙈' : '🙉'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
        <div className="relative">
          <input
            type={showCon ? 'text' : 'password'}
            value={conPass}
            onChange={e => setConPass(e.target.value)}
            placeholder="Re-enter password"
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-[#0b1957] bg-white"
          />
          <button
            type="button"
            onClick={() => setShowCon(!showCon)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-base select-none cursor-pointer"
          >
            {showCon ? '🙈' : '🙉'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-[#0b1957] hover:bg-[#101d6b] text-[#f7f4ed] py-3 rounded-full font-semibold text-xs shadow-md transition-colors mt-2 cursor-pointer"
      >
        Save Password
      </button>
    </form>
  );
}
