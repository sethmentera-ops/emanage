# 📊 EManage - Automated Event & Attendance Executive Report
*Generated on: 2026-10-26 10:47:25*

## 📌 Global Performance Overview
- **Total Events Managed:** `3` (Upcoming: `3`, Ongoing: `0`, Completed: `0`)
- **Total Guest Roster:** `50`
- **Confirmed RSVPs:** `34` (68.0% of total)
- **Declined RSVPs:** `16`
- **Pending RSVPs:** `0`
- **Actual Turnout (Attended):** `46` (135.3% of confirmed guests)

---
## 🗓️ Event Breakdown by Month
### 📅 October 2026
- **💍 Jane & Francis Wedding** (Upcoming)
  - Date/Time: `2026-10-05` at `09:00 AM` | Venue: `Tagaytay Ridge Chapel & Glass Pavilion`
  - Confirmed: `34 / 50` (68.0% capacity) | Attended: `46`
  - RSVP Link: https://forms.gle/aFGNLexpupZkvvpr8

- **🎉 Festival Joy** (Upcoming)
  - Date/Time: `2026-10-26` at `09:00 AM` | Venue: `Main Venue`
  - Confirmed: `0 / 50` (0.0% capacity) | Attended: `0`
  - RSVP Link: https://emanage-rsvp.com/confirm?event_id=evt_c3ac5612

- **🎉 New Event** (Upcoming)
  - Date/Time: `2026-10-26` at `09:00 AM` | Venue: `Main Venue`
  - Confirmed: `0 / 50` (0.0% capacity) | Attended: `0`
  - RSVP Link: https://emanage-rsvp.com/confirm?event_id=evt_ae093040

---
## 📝 Organizer Reminders & Notes
```text
• Prepare attendance list
• Confirm event venue
• Contact participants
```

---
## 🔍 Audit & Processing Log
```text
[10:47:25] [INFO] 🚀 Launching complete EManage automated data pipeline...
[10:47:25] [INFO] Starting automatic workspace scan at: /app/applet
[10:47:25] [INFO] Ingested 0 event(s) from em_events.db
[10:47:25] [INFO] Ingested 1 user(s) from users.db
[10:47:25] [INFO] Ingested 3 event(s) from JSON archive db.json
[10:47:25] [INFO] Ingested 0 guest(s) from Festival_Joy_Guest_List.csv into event 'Festival Joy'
[10:47:25] [INFO] Ingested 0 guest(s) from New_Event_Guest_List.csv into event 'New Event'
[10:47:25] [INFO] Ingested organizer notes from event_notes.txt
[10:47:25] [INFO] Auto-scan complete: 3 event(s), 50 guest(s), 1 user(s).
[10:47:25] [INFO] Exported unified SQLite database to emanage_master.db
[10:47:25] [INFO] Exported organized JSON data to emanage_organized_data.json
[10:47:25] [INFO] Exported 3 event CSV rosters to organized_exports/
```