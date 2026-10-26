#!/usr/bin/env python3
"""
========================================================================================
EManage - Automated Event RSVP & Attendance Data Processor
========================================================================================
A comprehensive, single-file Python data engine that automatically discovers, ingests,
cleans, deduplicates, organizes, and analyzes event management and attendance data from
multiple heterogeneous formats (SQLite databases, CSV rosters, JSON backups, and text files).

Author: EManage Engineering
Compatibility: Python 3.8+ (Zero external dependencies required; standard library only)
========================================================================================
"""

from __future__ import annotations

import argparse
import calendar
import csv
from dataclasses import asdict, dataclass, field
from datetime import date, datetime
from enum import Enum
import hashlib
import json
import logging
import math
import os
from pathlib import Path
import re
import sqlite3
import sys
from typing import Any, Dict, List, Optional, Set, Tuple
import urllib.parse

# --------------------------------------------------------------------------------------
# 1. LOGGING & ERROR HIERARCHY
# --------------------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("EManageProcessor")


class EManageError(Exception):
    """Base exception for all EManage processing operations."""
    pass


class ValidationError(EManageError):
    """Raised when data validation fails."""
    pass


class DatabaseError(EManageError):
    """Raised when SQLite operations fail."""
    pass


class DataProcessingError(EManageError):
    """Raised during parsing, transformation, or calculation."""
    pass


class ExportError(EManageError):
    """Raised when output file generation fails."""
    pass


# --------------------------------------------------------------------------------------
# 2. DOMAIN ENUMS & DATA MODELS
# --------------------------------------------------------------------------------------

class RSVPStatus(str, Enum):
    CONFIRMED = "Confirmed"
    PENDING = "Pending"
    DECLINED = "Declined"

    @classmethod
    def normalize(cls, raw: Optional[str]) -> "RSVPStatus":
        if not raw:
            return cls.PENDING
        clean = str(raw).strip().lower()
        if any(term in clean for term in ["confirm", "attending", "yes", "going", "pupunta", "oo", "present", "y"]):
            return cls.CONFIRMED
        if any(term in clean for term in ["declin", "cannot", "can't", "not attending", "no", "hindi", "absent", "n"]):
            return cls.DECLINED
        return cls.PENDING


class AttendanceStatus(str, Enum):
    ATTENDED = "Attended"
    ABSENT = "Absent"

    @classmethod
    def normalize(cls, raw: Optional[str], default_from_rsvp: Optional[RSVPStatus] = None) -> "AttendanceStatus":
        if not raw:
            if default_from_rsvp == RSVPStatus.CONFIRMED:
                return cls.ATTENDED
            return cls.ABSENT
        clean = str(raw).strip().lower()
        if any(term in clean for term in ["attend", "present", "checked-in", "checked in", "yes", "y", "dumalo"]):
            return cls.ATTENDED
        return cls.ABSENT


class EventStatus(str, Enum):
    UPCOMING = "Upcoming"
    ONGOING = "Ongoing"
    COMPLETED = "Completed"

    @classmethod
    def normalize(cls, raw: Optional[str]) -> "EventStatus":
        if not raw:
            return cls.UPCOMING
        clean = str(raw).strip().capitalize()
        for member in cls:
            if member.value.lower() == clean.lower():
                return member
        return cls.UPCOMING


@dataclass
class Guest:
    id: str
    name: str
    email: str
    invited: bool = True
    rsvp: RSVPStatus = RSVPStatus.PENDING
    attendance: AttendanceStatus = AttendanceStatus.ABSENT
    notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "invited": self.invited,
            "rsvp": self.rsvp.value,
            "attendance": self.attendance.value,
            "notes": self.notes,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Guest":
        gid = str(data.get("id") or f"g_{hashlib.md5(os.urandom(8)).hexdigest()[:8]}")
        name = str(data.get("name") or "Unnamed Guest").strip()
        email = str(data.get("email") or "").strip().lower()
        if not email:
            safe_user = re.sub(r"[^a-zA-Z0-9]", ".", name.lower()).strip(".") or "guest"
            email = f"{safe_user}@guest.local"

        invited = bool(data.get("invited", True))
        raw_rsvp = data.get("rsvp") if data.get("rsvp") is not None else data.get("status")
        rsvp = RSVPStatus.normalize(str(raw_rsvp) if raw_rsvp is not None else None)

        raw_att = data.get("attendance")
        attendance = AttendanceStatus.normalize(
            str(raw_att) if raw_att is not None else None, default_from_rsvp=rsvp
        )
        notes = str(data.get("notes") or "").strip()

        return cls(
            id=gid,
            name=name,
            email=email,
            invited=invited,
            rsvp=rsvp,
            attendance=attendance,
            notes=notes,
        )


@dataclass
class EventItem:
    id: str
    title: str
    desc: str = ""
    date: str = ""  # YYYY-MM-DD
    time: str = ""  # e.g., "09:00 AM" or "10:15 AM - 12:30 PM"
    location: str = "Main Venue"
    month_display: str = ""
    day_display: str = ""
    max_guests: int = 50
    rsvp_count: int = 0
    status: EventStatus = EventStatus.UPCOMING
    rsvp_link: str = ""
    guests: List[Guest] = field(default_factory=list)

    def calculate_metrics(self) -> Dict[str, Any]:
        total_invited = len(self.guests)
        confirmed = sum(1 for g in self.guests if g.rsvp == RSVPStatus.CONFIRMED)
        declined = sum(1 for g in self.guests if g.rsvp == RSVPStatus.DECLINED)
        pending = sum(1 for g in self.guests if g.rsvp == RSVPStatus.PENDING)
        attended = sum(1 for g in self.guests if g.attendance == AttendanceStatus.ATTENDED)
        absent = sum(1 for g in self.guests if g.attendance == AttendanceStatus.ABSENT)

        self.rsvp_count = confirmed
        capacity_rate = round((confirmed / max(self.max_guests, 1)) * 100, 1)
        attendance_turnout = (
            round((attended / max(confirmed, 1)) * 100, 1) if confirmed > 0 else 0.0
        )

        return {
            "total_invited": total_invited,
            "confirmed": confirmed,
            "declined": declined,
            "pending": pending,
            "attended": attended,
            "absent": absent,
            "max_guests": self.max_guests,
            "capacity_rate_pct": capacity_rate,
            "turnout_pct": attendance_turnout,
        }

    def detect_category(self) -> Dict[str, str]:
        text = f"{self.title} {self.desc}".lower()
        if any(w in text for w in ["wed", "kasal", "matrimony", "nuptial"]):
            return {
                "type": "wedding",
                "name": "Wedding Ceremony & Banquet",
                "icon": "💍",
                "theme_color": "#7c3aed",
            }
        if any(w in text for w in ["birth", "kaarawan", "bday", "debut", "party"]):
            return {
                "type": "birthday",
                "name": "Birthday Party & Celebration",
                "icon": "🎂",
                "theme_color": "#db2777",
            }
        if any(w in text for w in ["conference", "seminar", "summit", "workshop", "meeting", "tech"]):
            return {
                "type": "corporate",
                "name": "Conference & Professional Seminar",
                "icon": "💼",
                "theme_color": "#1d4ed8",
            }
        return {
            "type": "general",
            "name": "Event Celebration & Gathering",
            "icon": "🎉",
            "theme_color": "#0b1957",
        }

    def to_dict(self) -> Dict[str, Any]:
        metrics = self.calculate_metrics()
        return {
            "id": self.id,
            "title": self.title,
            "desc": self.desc,
            "date": self.date,
            "time": self.time,
            "location": self.location,
            "month_display": self.month_display,
            "day_display": self.day_display,
            "max_guests": self.max_guests,
            "rsvp_count": self.rsvp_count,
            "status": self.status.value,
            "rsvp_link": self.rsvp_link,
            "category": self.detect_category(),
            "metrics": metrics,
            "guests": [g.to_dict() for g in self.guests],
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "EventItem":
        eid = str(data.get("id") or f"evt_{hashlib.md5(os.urandom(8)).hexdigest()[:8]}")
        title = str(data.get("title") or "Untitled Event").strip()
        desc = str(data.get("desc") or data.get("description") or "").strip()
        raw_date = str(data.get("date") or data.get("raw_date") or "").strip()
        date_iso, month_disp, day_disp = normalize_date_components(raw_date)

        time_str = str(data.get("time") or "09:00 AM").strip()
        location = str(data.get("location") or "Main Venue").strip()

        try:
            max_g = int(data.get("max_guests", 50))
        except (ValueError, TypeError):
            max_g = 50

        status = EventStatus.normalize(str(data.get("status") or "Upcoming"))
        rsvp_link = str(data.get("rsvp_link") or f"https://emanage-rsvp.com/confirm?event_id={eid}")

        guests: List[Guest] = []
        raw_guests = data.get("guests")
        if isinstance(raw_guests, list):
            for rg in raw_guests:
                if isinstance(rg, dict):
                    try:
                        guests.append(Guest.from_dict(rg))
                    except Exception as e:
                        logger.warning(f"Skipping malformed guest entry in event {eid}: {e}")

        event = cls(
            id=eid,
            title=title,
            desc=desc,
            date=date_iso,
            time=time_str,
            location=location,
            month_display=data.get("month_display") or month_disp,
            day_display=data.get("day_display") or day_disp,
            max_guests=max(max_g, 1),
            status=status,
            rsvp_link=rsvp_link,
            guests=guests,
        )
        event.calculate_metrics()
        return event


@dataclass
class User:
    id: Any
    name: str
    email: str
    password: str = ""
    role: str = "Event Host & Admin"
    phone: str = ""
    organization: str = "Personal Workspace"
    created_at: str = ""

    def to_dict(self, include_sensitive: bool = False) -> Dict[str, Any]:
        res = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "phone": self.phone,
            "organization": self.organization,
            "created_at": self.created_at,
        }
        if include_sensitive:
            res["password"] = self.password
        return res

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "User":
        return cls(
            id=data.get("id") or 1,
            name=str(data.get("name") or "Admin User").strip(),
            email=str(data.get("email") or "admin@example.com").strip().lower(),
            password=str(data.get("password") or ""),
            role=str(data.get("role") or "Event Host & Admin").strip(),
            phone=str(data.get("phone") or "").strip(),
            organization=str(data.get("organization") or "Workspace").strip(),
            created_at=str(data.get("created_at") or data.get("createdAt") or datetime.now().strftime("%B %Y")),
        )


# --------------------------------------------------------------------------------------
# 3. HELPER FUNCTIONS & NORMALIZERS
# --------------------------------------------------------------------------------------

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")


def validate_email(email: str) -> bool:
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))


def normalize_date_components(date_str: str) -> Tuple[str, str, str]:
    """
    Parses various date string formats and returns (YYYY-MM-DD, Month YYYY, Mon DD).
    Handles potential parsing errors gracefully by defaulting to current date.
    """
    cleaned = date_str.strip()
    if not cleaned:
        today = date.today()
        return (
            today.isoformat(),
            today.strftime("%B %Y"),
            f"{today.strftime('%b')}\n{today.strftime('%d')}",
        )

    # Clean multi-line or formatted dates
    cleaned = cleaned.replace("\n", " ").strip()

    formats = [
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%B %d, %Y",
        "%b %d, %Y",
        "%d %b, %Y",
        "%d %B, %Y",
        "%b %d %Y",
        "%Y-%m",
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(cleaned, fmt)
            iso = dt.strftime("%Y-%m-%d")
            month_disp = dt.strftime("%B %Y")
            day_disp = f"{dt.strftime('%b')}\n{dt.strftime('%d')}"
            return iso, month_disp, day_disp
        except ValueError:
            continue

    match = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", cleaned)
    if match:
        try:
            y, m, d = int(match.group(1)), int(match.group(2)), int(match.group(3))
            dt = datetime(y, m, d)
            return dt.strftime("%Y-%m-%d"), dt.strftime("%B %Y"), f"{dt.strftime('%b')}\n{dt.strftime('%d')}"
        except Exception:
            pass

    today = date.today()
    logger.warning(f"Unrecognized date '{date_str}', falling back to {today.isoformat()}")
    return (
        today.isoformat(),
        today.strftime("%B %Y"),
        f"{today.strftime('%b')}\n{today.strftime('%d')}",
    )


def hash_password(password: str) -> str:
    """Computes a SHA-256 hash for secure storage comparison."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


# --------------------------------------------------------------------------------------
# 4. CORE EMANAGE PROCESSOR ENGINE
# --------------------------------------------------------------------------------------

class EManageProcessor:
    """
    Central processor that organizes all event data, guest lists, attendance records,
    notes, and users across SQLite, CSV, JSON, and text file sources.
    """

    def __init__(self, workspace_dir: str = "."):
        self.workspace = Path(workspace_dir).resolve()
        self.users: List[User] = []
        self.events: List[EventItem] = []
        self.notes: str = ""
        self.audit_log: List[str] = []

    def log(self, message: str, level: str = "info") -> None:
        getattr(logger, level.lower(), logger.info)(message)
        self.audit_log.append(f"[{datetime.now().strftime('%H:%M:%S')}] [{level.upper()}] {message}")

    # ----------------------------------------------------------------------------------
    # INGESTION: SQLite Databases
    # ----------------------------------------------------------------------------------

    def ingest_sqlite_users(self, db_path: Path) -> int:
        """Ingests users from a SQLite database with safety and fallback schema checks."""
        if not db_path.exists() or db_path.stat().st_size == 0:
            return 0
        imported = 0
        try:
            conn = sqlite3.connect(str(db_path))
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
            if not cur.fetchone():
                conn.close()
                return 0

            cur.execute("PRAGMA table_info(users);")
            col_names = [c[1].lower() for c in cur.fetchall()]
            cur.execute("SELECT * FROM users;")
            rows = cur.fetchall()

            for row in rows:
                row_dict = dict(zip(col_names, row))
                uid = row_dict.get("id") or (len(self.users) + 1)
                name = row_dict.get("name") or "User"
                email = row_dict.get("email") or f"user{uid}@example.com"
                password = row_dict.get("password") or row_dict.get("password_hash") or ""

                if not any(u.email.lower() == str(email).lower() for u in self.users):
                    self.users.append(
                        User(
                            id=uid,
                            name=str(name),
                            email=str(email),
                            password=str(password),
                        )
                    )
                    imported += 1
            conn.close()
            self.log(f"Ingested {imported} user(s) from {db_path.name}")
        except Exception as e:
            self.log(f"Error ingesting users from {db_path}: {e}", level="warning")
        return imported

    def ingest_sqlite_events(self, db_path: Path) -> int:
        """Ingests events from a SQLite database with schema adaptation."""
        if not db_path.exists() or db_path.stat().st_size == 0:
            return 0
        imported = 0
        try:
            conn = sqlite3.connect(str(db_path))
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='events';")
            if not cur.fetchone():
                conn.close()
                return 0

            cur.execute("PRAGMA table_info(events);")
            col_names = [c[1].lower() for c in cur.fetchall()]
            cur.execute("SELECT * FROM events;")
            rows = cur.fetchall()

            for row in rows:
                rd = dict(zip(col_names, row))
                eid = str(rd.get("id") or f"evt_{len(self.events) + 1}")
                title = str(rd.get("title") or "Untitled Event").strip()
                if not title:
                    continue

                desc = str(rd.get("description") or rd.get("desc") or "")
                raw_date = str(rd.get("date") or "")
                time_val = str(rd.get("time") or "09:00 AM")
                max_g = int(rd.get("max_guests") or 50)
                status = str(rd.get("status") or "Upcoming")
                rsvp_link = str(rd.get("rsvp_link") or "")

                # Load associated guests if a guests table exists in this DB
                guests: List[Guest] = []
                cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='guests';")
                if cur.fetchone():
                    cur.execute("PRAGMA table_info(guests);")
                    g_cols = [c[1].lower() for c in cur.fetchall()]
                    cur.execute("SELECT * FROM guests WHERE event_id = ?;", (eid,))
                    for g_row in cur.fetchall():
                        gd = dict(zip(g_cols, g_row))
                        guests.append(Guest.from_dict(gd))

                existing = next((e for e in self.events if e.id == eid or e.title.lower() == title.lower()), None)
                if existing:
                    if not existing.desc and desc:
                        existing.desc = desc
                    if not existing.rsvp_link and rsvp_link:
                        existing.rsvp_link = rsvp_link
                    for g in guests:
                        if not any(eg.email.lower() == g.email.lower() for eg in existing.guests):
                            existing.guests.append(g)
                    existing.calculate_metrics()
                else:
                    new_ev = EventItem.from_dict({
                        "id": eid,
                        "title": title,
                        "desc": desc,
                        "date": raw_date,
                        "time": time_val,
                        "max_guests": max_g,
                        "status": status,
                        "rsvp_link": rsvp_link,
                        "guests": [g.to_dict() for g in guests],
                    })
                    self.events.append(new_ev)
                    imported += 1

            conn.close()
            self.log(f"Ingested {imported} event(s) from {db_path.name}")
        except Exception as e:
            self.log(f"Error ingesting events from {db_path}: {e}", level="warning")
        return imported

    # ----------------------------------------------------------------------------------
    # INGESTION: CSV Files (Guest Lists & Responses)
    # ----------------------------------------------------------------------------------

    def ingest_csv_guest_list(self, csv_path: Path, target_event_title: Optional[str] = None) -> int:
        """
        Parses a guest list CSV and assigns guests to the matched event or creates
        a corresponding event container automatically.
        """
        if not csv_path.exists() or csv_path.stat().st_size == 0:
            return 0

        # Ignore self-generated export folder
        if "organized_exports" in str(csv_path.resolve()):
            return 0

        # Infer event name from filename
        raw_name = csv_path.stem
        clean_stem = re.sub(r"(_Guest_List|_Roster)$", "", raw_name, flags=re.IGNORECASE)
        clean_stem = clean_stem.replace("_", " ").strip()
        event_title = target_event_title or clean_stem or "General Event"

        # Match to existing event or create new
        target_event = next((e for e in self.events if e.title.lower() == event_title.lower()), None)
        if not target_event:
            target_event = EventItem.from_dict({
                "title": event_title,
                "desc": f"Event populated from {csv_path.name}",
                "date": date.today().isoformat(),
                "time": "09:00 AM",
                "max_guests": 50,
                "status": "Upcoming",
                "guests": [],
            })
            self.events.append(target_event)

        count = 0
        try:
            with open(csv_path, mode="r", encoding="utf-8-sig", errors="replace") as f:
                sample = f.read(2048)
                f.seek(0)
                delimiter = ","
                if "\t" in sample and "," not in sample:
                    delimiter = "\t"
                elif ";" in sample and "," not in sample:
                    delimiter = ";"

                reader = csv.reader(f, delimiter=delimiter)
                header = next(reader, None)
                if not header:
                    return 0

                header_lower = [h.strip().lower() for h in header]
                name_idx = next((i for i, h in enumerate(header_lower) if any(k in h for k in ["name", "pangalan", "full name"])), 0)
                email_idx = next((i for i, h in enumerate(header_lower) if "email" in h or "mail" in h), -1)
                rsvp_idx = next((i for i, h in enumerate(header_lower) if any(k in h for k in ["rsvp", "status", "response", "attendance", "attend"])), -1)
                att_idx = next((i for i, h in enumerate(header_lower) if "attendance" in h), -1)
                notes_idx = next((i for i, h in enumerate(header_lower) if "note" in h or "message" in h), -1)

                for row_num, row in enumerate(reader, start=2):
                    if not row or all(not cell.strip() for cell in row):
                        continue
                    try:
                        name = row[name_idx].strip() if name_idx < len(row) else ""
                        if not name:
                            continue

                        email = ""
                        if email_idx != -1 and email_idx < len(row):
                            email = row[email_idx].strip()

                        raw_rsvp = ""
                        if rsvp_idx != -1 and rsvp_idx < len(row):
                            raw_rsvp = row[rsvp_idx].strip()
                        elif len(row) >= 3 and name_idx != 2 and email_idx != 2:
                            raw_rsvp = row[2].strip()

                        raw_att = row[att_idx].strip() if att_idx != -1 and att_idx < len(row) else None
                        notes = row[notes_idx].strip() if notes_idx != -1 and notes_idx < len(row) else ""

                        guest = Guest.from_dict({
                            "name": name,
                            "email": email,
                            "rsvp": raw_rsvp,
                            "attendance": raw_att,
                            "notes": notes,
                            "invited": True,
                        })

                        existing_g_idx = next(
                            (i for i, g in enumerate(target_event.guests) if g.email.lower() == guest.email.lower() or g.name.lower() == guest.name.lower()),
                            -1,
                        )
                        if existing_g_idx >= 0:
                            target_event.guests[existing_g_idx] = guest
                        else:
                            target_event.guests.append(guest)
                        count += 1
                    except Exception as row_err:
                        self.log(f"Row {row_num} in {csv_path.name} skipped: {row_err}", level="debug")

            target_event.calculate_metrics()
            self.log(f"Ingested {count} guest(s) from {csv_path.name} into event '{target_event.title}'")
        except Exception as e:
            self.log(f"Error parsing CSV {csv_path}: {e}", level="warning")
        return count

    # ----------------------------------------------------------------------------------
    # INGESTION: JSON Archives & Text Notes
    # ----------------------------------------------------------------------------------

    def ingest_json_backup(self, json_path: Path) -> int:
        """Loads events and guests from db.json or exported JSON file."""
        if not json_path.exists() or json_path.stat().st_size == 0:
            return 0
        imported = 0
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                content = json.load(f)

            raw_events = content.get("events") if isinstance(content, dict) else content
            if isinstance(raw_events, list):
                for ev_data in raw_events:
                    if isinstance(ev_data, dict):
                        ev = EventItem.from_dict(ev_data)
                        existing = next((e for e in self.events if e.id == ev.id or e.title.lower() == ev.title.lower()), None)
                        if existing:
                            for g in ev.guests:
                                if not any(eg.email.lower() == g.email.lower() for eg in existing.guests):
                                    existing.guests.append(g)
                            existing.calculate_metrics()
                        else:
                            self.events.append(ev)
                            imported += 1

            if isinstance(content, dict) and "users" in content and isinstance(content["users"], list):
                for udata in content["users"]:
                    if isinstance(udata, dict):
                        u = User.from_dict(udata)
                        if not any(eu.email.lower() == u.email.lower() for eu in self.users):
                            self.users.append(u)

            if isinstance(content, dict) and "notes" in content and isinstance(content["notes"], str):
                if content["notes"].strip() and not self.notes:
                    self.notes = content["notes"].strip()

            self.log(f"Ingested {imported} event(s) from JSON archive {json_path.name}")
        except Exception as e:
            self.log(f"Error reading JSON backup {json_path}: {e}", level="warning")
        return imported

    def ingest_text_notes(self, txt_path: Path) -> bool:
        """Reads organizer reminder notes."""
        if not txt_path.exists():
            return False
        try:
            with open(txt_path, "r", encoding="utf-8", errors="replace") as f:
                text = f.read().strip()
                if text:
                    self.notes = text
                    self.log(f"Ingested organizer notes from {txt_path.name}")
                    return True
        except Exception as e:
            self.log(f"Error reading notes from {txt_path}: {e}", level="warning")
        return False

    # ----------------------------------------------------------------------------------
    # AUTOMATED DISCOVERY & DATA COMPOSITION
    # ----------------------------------------------------------------------------------

    def auto_discover_and_ingest(self) -> Dict[str, int]:
        """
        Scans workspace directory recursively for databases, CSVs, JSON archives,
        and notes, ingesting and merging them automatically.
        """
        self.log(f"Starting automatic workspace scan at: {self.workspace}")
        stats = {
            "sqlite_dbs_found": 0,
            "csvs_found": 0,
            "json_found": 0,
            "events_loaded": 0,
            "guests_loaded": 0,
            "users_loaded": 0,
        }

        # 1. SQLite databases (skip output DBs and cache folders)
        db_candidates = list(self.workspace.glob("**/*.db")) + list(self.workspace.glob("**/*.sqlite"))
        seen_dbs: Set[Path] = set()
        for db_file in db_candidates:
            if "__pycache__" in str(db_file) or "node_modules" in str(db_file) or "emanage_master.db" in str(db_file):
                continue
            resolved = db_file.resolve()
            if resolved in seen_dbs:
                continue
            seen_dbs.add(resolved)
            stats["sqlite_dbs_found"] += 1
            self.ingest_sqlite_users(db_file)
            self.ingest_sqlite_events(db_file)

        # 2. JSON files (skip master output JSON)
        json_candidates = [
            self.workspace / "data" / "db.json",
            self.workspace / "db.json",
        ]
        for jfile in json_candidates:
            if jfile.exists():
                stats["json_found"] += 1
                self.ingest_json_backup(jfile)

        # 3. CSV files (skip output directory)
        csv_candidates = list(self.workspace.glob("**/*.csv"))
        for cfile in csv_candidates:
            if "node_modules" in str(cfile) or ".git" in str(cfile) or "organized_exports" in str(cfile):
                continue
            stats["csvs_found"] += 1
            self.ingest_csv_guest_list(cfile)

        # 4. Notes files
        notes_candidates = [
            self.workspace / "event_notes.txt",
            self.workspace / "notes.txt",
        ]
        for nfile in notes_candidates:
            if nfile.exists():
                self.ingest_text_notes(nfile)

        # 5. Default admin user fallback if none exists
        if not self.users:
            self.users.append(
                User(
                    id=1,
                    name="Jhean",
                    email="jheanroseg@gmail.com",
                    password=hash_password("arigatoujinrus"),
                    role="Event Coordinator & Admin",
                    phone="+63 912 345 6789",
                    organization="EManage Events Studio",
                )
            )

        # 6. Recalculate metrics for all events
        for ev in self.events:
            ev.calculate_metrics()

        stats["events_loaded"] = len(self.events)
        stats["guests_loaded"] = sum(len(e.guests) for e in self.events)
        stats["users_loaded"] = len(self.users)

        self.log(
            f"Auto-scan complete: {stats['events_loaded']} event(s), "
            f"{stats['guests_loaded']} guest(s), {stats['users_loaded']} user(s)."
        )
        return stats

    # ----------------------------------------------------------------------------------
    # SAMPLE DATA SEEDING (Jane & Francis Wedding, Festival Joy)
    # ----------------------------------------------------------------------------------

    def seed_sample_wedding_template(self) -> EventItem:
        """Seeds the standard Jane & Francis Wedding template with 50 guests."""
        sample_guests_data = [
            ("Alexander Wright", "alexander.wright@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Beatrice Miller", "beatrice.m@example.com", RSVPStatus.PENDING, AttendanceStatus.ABSENT),
            ("Carlos Mendez", "carlos.mendez@example.com", RSVPStatus.DECLINED, AttendanceStatus.ABSENT),
            ("Diana Prince", "diana.prince@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Ethan Hawke", "ethan.hawke@example.com", RSVPStatus.PENDING, AttendanceStatus.ATTENDED),
            ("Fiona Gallagher", "fiona.g@example.com", RSVPStatus.DECLINED, AttendanceStatus.ABSENT),
            ("George Clark", "george.clark@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Hannah Abbott", "hannah.abbott@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Ian Malcolm", "ian.malcolm@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Julia Roberts", "julia.roberts@example.com", RSVPStatus.PENDING, AttendanceStatus.ATTENDED),
            ("Kevin Costner", "kevin.costner@example.com", RSVPStatus.PENDING, AttendanceStatus.ATTENDED),
            ("Laura Croft", "laura.croft@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Michael Scott", "michael.scott@example.com", RSVPStatus.DECLINED, AttendanceStatus.ABSENT),
            ("Nora Ephron", "nora.e@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Oliver Twist", "oliver.t@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Penelope Cruz", "penelope.cruz@example.com", RSVPStatus.PENDING, AttendanceStatus.ATTENDED),
            ("Quentin Tarantino", "quentin.t@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Rachel Green", "rachel.green@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Steve Rogers", "steve.rogers@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Tina Fey", "tina.fey@example.com", RSVPStatus.PENDING, AttendanceStatus.ATTENDED),
            ("Uma Thurman", "uma.thurman@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Victor Hugo", "victor.hugo@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Wanda Maximoff", "wanda.m@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Xavier Charles", "xavier.c@example.com", RSVPStatus.PENDING, AttendanceStatus.ATTENDED),
            ("Yvonne Strahovski", "yvonne.s@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Zachary Levi", "zachary.l@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Amelia Earhart", "amelia.e@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Benjamin Franklin", "benjamin.f@example.com", RSVPStatus.PENDING, AttendanceStatus.ATTENDED),
            ("Clara Barton", "clara.b@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("David Beckham", "david.b@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Emma Watson", "emma.watson@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Freddie Mercury", "freddie.m@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Grace Kelly", "grace.kelly@example.com", RSVPStatus.PENDING, AttendanceStatus.ATTENDED),
            ("Harry Potter", "harry.p@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Isla Fisher", "isla.f@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Jack Sparrow", "jack.sparrow@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Keira Knightley", "keira.k@example.com", RSVPStatus.PENDING, AttendanceStatus.ATTENDED),
            ("Leonardo DiCaprio", "leonardo.d@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Meryl Streep", "meryl.s@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Natalie Portman", "natalie.p@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Oscar Isaac", "oscar.i@example.com", RSVPStatus.PENDING, AttendanceStatus.ATTENDED),
            ("Paul Rudd", "paul.rudd@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Queen Latifah", "queen.l@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Ryan Gosling", "ryan.g@example.com", RSVPStatus.PENDING, AttendanceStatus.ATTENDED),
            ("Scarlett Johansson", "scarlett.j@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Tom Hanks", "tom.hanks@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Ursula Corbero", "ursula.c@example.com", RSVPStatus.PENDING, AttendanceStatus.ATTENDED),
            ("Vin Diesel", "vin.diesel@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Will Smith", "will.smith@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
            ("Zoe Saldana", "zoe.saldana@example.com", RSVPStatus.CONFIRMED, AttendanceStatus.ATTENDED),
        ]

        existing = next((e for e in self.events if "jane & francis" in e.title.lower()), None)
        if existing:
            if len(existing.guests) < 50:
                for name, email, rsvp, att in sample_guests_data:
                    if not any(g.email.lower() == email.lower() for g in existing.guests):
                        existing.guests.append(Guest(
                            id=f"g_{len(existing.guests)+1}",
                            name=name,
                            email=email,
                            invited=True,
                            rsvp=rsvp,
                            attendance=att
                        ))
                existing.calculate_metrics()
            return existing

        guests = [
            Guest(
                id=f"g_{i+1}",
                name=name,
                email=email,
                invited=True,
                rsvp=rsvp,
                attendance=att,
            )
            for i, (name, email, rsvp, att) in enumerate(sample_guests_data)
        ]

        wedding_event = EventItem(
            id="evt_wedding_sample",
            title="Jane & Francis Wedding",
            desc="Grand holy matrimony and banquet celebration at Tagaytay Ridge.",
            date="2026-10-05",
            time="09:00 AM",
            location="Tagaytay Ridge Chapel & Glass Pavilion",
            month_display="October 2026",
            day_display="Oct\n05",
            max_guests=50,
            status=EventStatus.UPCOMING,
            rsvp_link="https://forms.gle/aFGNLexpupZkvvpr8",
            guests=guests,
        )
        wedding_event.calculate_metrics()
        self.events.insert(0, wedding_event)
        self.log("Seeded 'Jane & Francis Wedding' template with 50 guests")
        return wedding_event

    # ----------------------------------------------------------------------------------
    # ORGANIZED DATA AGGREGATION & REPORTING
    # ----------------------------------------------------------------------------------

    def get_organized_summary(self) -> Dict[str, Any]:
        """
        Organizes the entire event dataset by month, status, categories, and metrics.
        """
        sorted_events = sorted(self.events, key=lambda e: e.date or "9999-12-31")

        by_month: Dict[str, List[Dict[str, Any]]] = {}
        for ev in sorted_events:
            m = ev.month_display or "Upcoming"
            by_month.setdefault(m, []).append(ev.to_dict())

        upcoming = [ev.to_dict() for ev in sorted_events if ev.status == EventStatus.UPCOMING]
        ongoing = [ev.to_dict() for ev in sorted_events if ev.status == EventStatus.ONGOING]
        completed = [ev.to_dict() for ev in sorted_events if ev.status == EventStatus.COMPLETED]

        total_guests = sum(len(e.guests) for e in sorted_events)
        total_confirmed = sum(sum(1 for g in e.guests if g.rsvp == RSVPStatus.CONFIRMED) for e in sorted_events)
        total_declined = sum(sum(1 for g in e.guests if g.rsvp == RSVPStatus.DECLINED) for e in sorted_events)
        total_pending = sum(sum(1 for g in e.guests if g.rsvp == RSVPStatus.PENDING) for e in sorted_events)
        total_attended = sum(sum(1 for g in e.guests if g.attendance == AttendanceStatus.ATTENDED) for e in sorted_events)
        total_absent = sum(sum(1 for g in e.guests if g.attendance == AttendanceStatus.ABSENT) for e in sorted_events)

        overall_confirmation_pct = round((total_confirmed / max(total_guests, 1)) * 100, 1) if total_guests > 0 else 0.0
        overall_turnout_pct = round((total_attended / max(total_confirmed, 1)) * 100, 1) if total_confirmed > 0 else 0.0

        return {
            "timestamp": datetime.now().isoformat(),
            "global_metrics": {
                "total_events": len(sorted_events),
                "upcoming_events": len(upcoming),
                "ongoing_events": len(ongoing),
                "completed_events": len(completed),
                "total_guests": total_guests,
                "confirmed_guests": total_confirmed,
                "declined_guests": total_declined,
                "pending_guests": total_pending,
                "attended_guests": total_attended,
                "absent_guests": total_absent,
                "overall_confirmation_pct": overall_confirmation_pct,
                "overall_turnout_pct": overall_turnout_pct,
            },
            "events_by_month": by_month,
            "events_by_status": {
                "upcoming": upcoming,
                "ongoing": ongoing,
                "completed": completed,
            },
            "users": [u.to_dict(include_sensitive=False) for u in self.users],
            "organizer_notes": self.notes or "  Prepare attendance list\n  Confirm event venue\n  Contact participants",
            "audit_log": self.audit_log[-20:],
        }

    # ----------------------------------------------------------------------------------
    # EXPORT PIPELINES: Master SQLite, JSON, CSV Rosters, Markdown Report
    # ----------------------------------------------------------------------------------

    def export_master_sqlite(self, target_path: Optional[Path] = None) -> Path:
        """
        Creates or updates a clean, unified SQLite database containing all events,
        guests, users, notes, and metrics.
        """
        out_file = target_path or (self.workspace / "emanage_master.db")
        try:
            conn = sqlite3.connect(str(out_file))
            cur = conn.cursor()

            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT,
                    role TEXT,
                    phone TEXT,
                    organization TEXT,
                    created_at TEXT
                );
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    date TEXT NOT NULL,
                    time TEXT NOT NULL,
                    location TEXT,
                    month_display TEXT,
                    day_display TEXT,
                    max_guests INTEGER NOT NULL,
                    rsvp_count INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'Upcoming',
                    rsvp_link TEXT,
                    category_name TEXT,
                    category_icon TEXT,
                    updated_at TEXT
                );
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS guests (
                    id TEXT PRIMARY KEY,
                    event_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    invited INTEGER DEFAULT 1,
                    rsvp TEXT DEFAULT 'Pending',
                    attendance TEXT DEFAULT 'Absent',
                    notes TEXT,
                    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
                );
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    updated_at TEXT
                );
            """)

            for u in self.users:
                cur.execute("""
                    INSERT OR REPLACE INTO users (id, name, email, password_hash, role, phone, organization, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    str(u.id), u.name, u.email, u.password, u.role, u.phone, u.organization, u.created_at
                ))

            for ev in self.events:
                cat = ev.detect_category()
                cur.execute("""
                    INSERT OR REPLACE INTO events (
                        id, title, description, date, time, location,
                        month_display, day_display, max_guests, rsvp_count,
                        status, rsvp_link, category_name, category_icon, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    ev.id, ev.title, ev.desc, ev.date, ev.time, ev.location,
                    ev.month_display, ev.day_display, ev.max_guests, ev.rsvp_count,
                    ev.status.value, ev.rsvp_link, cat["name"], cat["icon"], datetime.now().isoformat()
                ))

                for g in ev.guests:
                    cur.execute("""
                        INSERT OR REPLACE INTO guests (id, event_id, name, email, invited, rsvp, attendance, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                    """, (
                        g.id, ev.id, g.name, g.email, 1 if g.invited else 0,
                        g.rsvp.value, g.attendance.value, g.notes
                    ))

            cur.execute("DELETE FROM notes;")
            cur.execute("INSERT INTO notes (content, updated_at) VALUES (?, ?);", (self.notes, datetime.now().isoformat()))

            conn.commit()
            conn.close()
            self.log(f"Exported unified SQLite database to {out_file.name}")
            return out_file
        except Exception as e:
            self.log(f"Failed to export SQLite master database: {e}", level="error")
            raise DatabaseError(f"Failed to write SQLite master: {e}") from e

    def export_master_json(self, target_path: Optional[Path] = None) -> Path:
        """Exports the complete organized dataset to a JSON file."""
        out_file = target_path or (self.workspace / "emanage_organized_data.json")
        try:
            summary = self.get_organized_summary()
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(summary, f, indent=2, ensure_ascii=False)
            self.log(f"Exported organized JSON data to {out_file.name}")
            return out_file
        except Exception as e:
            self.log(f"Failed to export JSON: {e}", level="error")
            raise ExportError(f"Failed to write JSON: {e}") from e

    def export_csv_rosters(self, output_dir: Optional[Path] = None) -> List[Path]:
        """Generates clean CSV rosters for each event."""
        target_dir = output_dir or (self.workspace / "organized_exports")
        target_dir.mkdir(parents=True, exist_ok=True)
        created_files: List[Path] = []

        try:
            for ev in self.events:
                safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", ev.title)
                csv_file = target_dir / f"{safe_name}_Roster.csv"
                with open(csv_file, mode="w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(["Name", "Email", "Invited", "RSVP", "Attendance", "Notes"])
                    for g in ev.guests:
                        writer.writerow([
                            g.name,
                            g.email,
                            "Yes" if g.invited else "No",
                            g.rsvp.value,
                            g.attendance.value,
                            g.notes,
                        ])
                created_files.append(csv_file)
            self.log(f"Exported {len(created_files)} event CSV rosters to {target_dir.name}/")
            return created_files
        except Exception as e:
            self.log(f"Failed to export CSV rosters: {e}", level="error")
            raise ExportError(f"CSV export error: {e}") from e

    def generate_markdown_report(self, target_path: Optional[Path] = None) -> Path:
        """Generates a comprehensive executive Markdown report."""
        out_file = target_path or (self.workspace / "emanage_summary_report.md")
        summary = self.get_organized_summary()
        gm = summary["global_metrics"]

        md_lines = [
            "# 📊 EManage - Automated Event & Attendance Executive Report",
            f"*Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*",
            "",
            "## 📌 Global Performance Overview",
            f"- **Total Events Managed:** `{gm['total_events']}` (Upcoming: `{gm['upcoming_events']}`, Ongoing: `{gm['ongoing_events']}`, Completed: `{gm['completed_events']}`)",
            f"- **Total Guest Roster:** `{gm['total_guests']}`",
            f"- **Confirmed RSVPs:** `{gm['confirmed_guests']}` ({gm['overall_confirmation_pct']}% of total)",
            f"- **Declined RSVPs:** `{gm['declined_guests']}`",
            f"- **Pending RSVPs:** `{gm['pending_guests']}`",
            f"- **Actual Turnout (Attended):** `{gm['attended_guests']}` ({gm['overall_turnout_pct']}% of confirmed guests)",
            "",
            "---",
            "## 🗓️ Event Breakdown by Month",
        ]

        for month, ev_list in summary["events_by_month"].items():
            md_lines.append(f"### 📅 {month}")
            for ev in ev_list:
                m = ev["metrics"]
                cat = ev["category"]
                md_lines.extend([
                    f"- **{cat['icon']} {ev['title']}** ({ev['status']})",
                    f"  - Date/Time: `{ev['date']}` at `{ev['time']}` | Venue: `{ev['location']}`",
                    f"  - Confirmed: `{m['confirmed']} / {m['max_guests']}` ({m['capacity_rate_pct']}% capacity) | Attended: `{m['attended']}`",
                    f"  - RSVP Link: {ev['rsvp_link']}",
                    "",
                ])

        md_lines.extend([
            "---",
            "## 📝 Organizer Reminders & Notes",
            "```text",
            summary["organizer_notes"],
            "```",
            "",
            "---",
            "## 🔍 Audit & Processing Log",
            "```text",
            "\n".join(summary["audit_log"]),
            "```",
        ])

        try:
            with open(out_file, "w", encoding="utf-8") as f:
                f.write("\n".join(md_lines))
            self.log(f"Exported Markdown report to {out_file.name}")
            return out_file
        except Exception as e:
            self.log(f"Failed to generate Markdown report: {e}", level="error")
            raise ExportError(f"Markdown report error: {e}") from e

    # ----------------------------------------------------------------------------------
    # FULL AUTOMATED PIPELINE EXECUTION
    # ----------------------------------------------------------------------------------

    def run_full_pipeline(self) -> Dict[str, Any]:
        """
        Executes the entire automated sequence:
          1. Auto-discover and ingest all data sources.
          2. Seed sample templates if dataset is empty.
          3. Organize and normalize events and guests.
          4. Export master SQLite database.
          5. Export organized JSON.
          6. Export per-event CSV rosters.
          7. Export Markdown executive report.
        """
        self.log("🚀 Launching complete EManage automated data pipeline...")
        scan_stats = self.auto_discover_and_ingest()

        if len(self.events) == 0:
            self.seed_sample_wedding_template()

        sqlite_path = self.export_master_sqlite()
        json_path = self.export_master_json()
        csv_paths = self.export_csv_rosters()
        report_path = self.generate_markdown_report()

        summary = self.get_organized_summary()
        summary["pipeline_outputs"] = {
            "sqlite_database": str(sqlite_path),
            "json_archive": str(json_path),
            "csv_rosters_count": len(csv_paths),
            "markdown_report": str(report_path),
        }
        self.log("✅ Pipeline completed successfully.")
        return summary


# --------------------------------------------------------------------------------------
# 5. CLI & SCRIPT ENTRY POINT
# --------------------------------------------------------------------------------------

def print_ascii_dashboard(summary: Dict[str, Any]) -> None:
    """Renders a formatted text dashboard in the terminal."""
    gm = summary["global_metrics"]
    divider = "═" * 70
    print("\n" + divider)
    print("   ✨ EMANAGE - EVENT RSVP & ATTENDANCE DATA PROCESSOR ✨")
    print(divider)
    print(f" Total Events Managed: {gm['total_events']:<5} │ Upcoming: {gm['upcoming_events']:<4} │ Ongoing: {gm['ongoing_events']:<4} │ Completed: {gm['completed_events']}")
    print(f" Total Guest Roster:   {gm['total_guests']:<5} │ Confirmed: {gm['confirmed_guests']:<3} │ Declined: {gm['declined_guests']:<3} │ Pending: {gm['pending_guests']}")
    print(f" Overall Turnout:      {gm['attended_guests']} Attended ({gm['overall_turnout_pct']}% of confirmed)")
    print(divider)

    print("\n📅 SCHEDULED EVENTS & ROSTERS:")
    for month, ev_list in summary["events_by_month"].items():
        print(f"\n ► {month.upper()}:")
        for ev in ev_list:
            m = ev["metrics"]
            cat = ev["category"]
            print(f"   [{cat['icon']}] {ev['title']:<28} │ {ev['date']} @ {ev['time']:<10} │ {m['confirmed']}/{m['max_guests']} RSVP ({m['capacity_rate_pct']}%) │ [{ev['status']}]")

    print(f"\n{divider}")
    outputs = summary.get("pipeline_outputs", {})
    if outputs:
        print("💾 GENERATED MASTER EXPORTS:")
        for k, v in outputs.items():
            print(f"   • {k}: {v}")
        print(divider)
    print()


def main():
    parser = argparse.ArgumentParser(
        description="EManage: Automated Event RSVP & Attendance Data Processor and Organizer."
    )
    parser.add_argument(
        "--workspace",
        "-w",
        default=".",
        help="Workspace directory to scan (default: current directory).",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output raw organized JSON to stdout for programmatic integration.",
    )
    parser.add_argument(
        "--add-sample",
        action="store_true",
        help="Seed Jane & Francis Wedding and sample rosters.",
    )
    parser.add_argument(
        "--export-only",
        action="store_true",
        help="Only run exports without terminal visual banner.",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Execute internal verification test suite.",
    )

    args = parser.parse_args()

    processor = EManageProcessor(workspace_dir=args.workspace)

    if args.self_test:
        print("Running EManage Processor self-tests...")
        assert validate_email("test@example.com") is True
        assert validate_email("invalid-email") is False
        iso, m_disp, d_disp = normalize_date_components("2026-10-05")
        assert iso == "2026-10-05"
        assert m_disp == "October 2026"
        assert RSVPStatus.normalize("yes, will attend") == RSVPStatus.CONFIRMED
        assert RSVPStatus.normalize("cannot make it") == RSVPStatus.DECLINED
        assert AttendanceStatus.normalize("checked in") == AttendanceStatus.ATTENDED
        processor.seed_sample_wedding_template()
        summary = processor.run_full_pipeline()
        assert summary["global_metrics"]["total_events"] >= 1
        print("✅ All self-tests passed successfully!")
        sys.exit(0)

    if args.add_sample:
        processor.seed_sample_wedding_template()

    summary = processor.run_full_pipeline()

    if args.json:
        print(json.dumps(summary, indent=2))
    else:
        print_ascii_dashboard(summary)


if __name__ == "__main__":
    main()
