import customtkinter as ctk
from tkinter import messagebox, ttk
from PIL import Image, ImageDraw
import calendar
from datetime import datetime
import math
import csv
import uuid
import sqlite3

ctk.set_appearance_mode("light")

events_window = ctk.CTk()
events_window.geometry("1200x700+140+0")
events_window.title("EM Events")

edit_img = ctk.CTkImage(
    light_image=Image.open("edit.png"),
    dark_image=Image.open("edit.png"),
    size=(20, 20)
)
delete_img = ctk.CTkImage(
    light_image=Image.open("delete.png"),
    dark_image=Image.open("delete.png"),
    size=(20, 20)
)

# ─── DATABASE ───
def init_db():
    conn = sqlite3.connect("em_events.db")
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            month_display TEXT,
            day_display TEXT,
            max_guests INTEGER NOT NULL,
            rsvp_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Upcoming',
            rsvp_link TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

def save_event(event_data):
    conn = sqlite3.connect("em_events.db")
    c = conn.cursor()
    c.execute("""
        INSERT INTO events 
        (id, title, description, date, time, month_display, day_display, max_guests, rsvp_count, status, rsvp_link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event_data["id"], event_data["title"], event_data["desc"],
        event_data["raw_date"], event_data["time"], event_data["month"],
        event_data["date"].replace("\n", " "),
        int(event_data["RSVP"].split(" / ")[1]),
        int(event_data["RSVP"].split(" / ")[0]),
        event_data["status"], event_data["rsvp_link"]
    ))
    conn.commit()
    conn.close()

def load_events():
    conn = sqlite3.connect("em_events.db")
    c = conn.cursor()
    c.execute("SELECT * FROM events ORDER BY date DESC")
    rows = c.fetchall()
    conn.close()
    events = []
    for r in rows:
        events.append({
            "id": r[0], "title": r[1], "desc": r[2], "raw_date": r[3],
            "time": r[4], "month": r[5], "date": r[6].replace(" ", "\n"),
            "RSVP": f"{r[8]} / {r[7]}", "status": r[9], "rsvp_link": r[10], "guests": []
        })
    return events

def delete_event_db(event_id):
    conn = sqlite3.connect("em_events.db")
    c = conn.cursor()
    c.execute("DELETE FROM events WHERE id = ?", (event_id,))
    conn.commit()
    conn.close()

# ─── Circular Progress ───
def create_circular_progress(percent, size=24, bg_color="#f0f0f0", fg_color="#d62828"):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    border = 2
    draw.ellipse([border, border, size-border, size-border], fill=bg_color)
    if percent > 0:
        cx, cy = size/2, size/2
        r = size/2 - border
        start = -math.pi / 2
        end = start + 2 * math.pi * (percent / 100)
        points = [(cx, cy)]
        steps = max(1, int(percent * 3.6) + 1)
        for i in range(steps + 1):
            a = start + (end - start) * i / steps
            points.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        points.append((cx, cy))
        draw.polygon(points, fill=fg_color)
        draw.ellipse([border, border, size-border, size-border], outline=fg_color, width=border)
    return ctk.CTkImage(light_image=img, size=(size, size))

# ─── RSVP Link ───
def generate_rsvp_link(event_id):
    return f"https://emanage-rsvp.com/confirm?event_id={event_id}"

def copy_link(event_data):
    if "rsvp_link" in event_data and event_data["rsvp_link"]:
        events_window.clipboard_clear()
        events_window.clipboard_append(event_data["rsvp_link"])
        messagebox.showinfo("✅ Copied", "RSVP link copied to clipboard!")

# ─── Export CSV ───
def export_guest_list(event_name, guest_list):
    filename = f"{event_name.replace(' ', '_')}_Guest_List.csv"
    try:
        with open(filename, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["Name", "Email", "Status"])
            for g in guest_list:
                writer.writerow([g.get("name", ""), g.get("email", ""), g.get("status", "")])
        messagebox.showinfo("✅ Exported", f"Saved as:\n{filename}")
    except Exception as e:
        messagebox.showerror("❌ Error", str(e))

# ─── Calendar Date Picker ───
def open_calendar_picker(parent, entry_widget):
    top = ctk.CTkToplevel(parent)
    top.title("Select Date")
    top.geometry("360x420")
    top.grab_set()
    x = parent.winfo_x() + (parent.winfo_width() - 360) // 2
    y = parent.winfo_y() + (parent.winfo_height() - 420) // 2
    top.geometry(f"+{x}+{y}")

    now = datetime.now()
    sel_year = [now.year]
    sel_month = [now.month]
    selected_date = [None]

    header_fr = ctk.CTkFrame(top, fg_color="transparent")
    header_fr.pack(fill="x", padx=10, pady=10)

    def render_cal():
        for w in content_fr.winfo_children(): w.destroy()
        ctk.CTkLabel(content_fr, text=calendar.month_name[sel_month[0]] + " " + str(sel_year[0]),
                     font=("Verdana", 14, "bold"), text_color="#0b1957").pack(pady=5)
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        row_fr = ctk.CTkFrame(content_fr, fg_color="transparent")
        row_fr.pack(fill="x", padx=5)
        for d in days:
            ctk.CTkLabel(row_fr, text=d, font=("Verdana", 9, "bold"), text_color="#999",
                         width=45).pack(side="left", padx=1)
        cal_dates = calendar.monthcalendar(sel_year[0], sel_month[0])
        for week in cal_dates:
            row_fr = ctk.CTkFrame(content_fr, fg_color="transparent")
            row_fr.pack(fill="x", padx=5)
            for day in week:
                if day == 0:
                    ctk.CTkLabel(row_fr, text="", width=45, height=35).pack(side="left", padx=1)
                else:
                    def on_click(d=day):
                        selected_date[0] = f"{sel_year[0]}-{sel_month[0]:02d}-{d:02d}"
                        entry_widget.delete(0, "end")
                        entry_widget.insert(0, selected_date[0])
                        top.destroy()
                    btn = ctk.CTkButton(row_fr, text=str(day), width=45, height=35,
                                       fg_color="transparent", text_color="#333",
                                       hover_color="#e8eaf6", command=on_click)
                    btn.pack(side="left", padx=1)

    ctk.CTkButton(header_fr, text="<", width=30, command=lambda: (
        sel_month.__setitem__(0, sel_month[0]-1) if sel_month[0]>1 else (sel_month.__setitem__(0,12), sel_year.__setitem__(0,sel_year[0]-1)),
        render_cal()
    )).pack(side="left")
    ctk.CTkButton(header_fr, text=">", width=30, command=lambda: (
        sel_month.__setitem__(0, sel_month[0]+1) if sel_month[0]<12 else (sel_month.__setitem__(0,1), sel_year.__setitem__(0,sel_year[0]+1)),
        render_cal()
    )).pack(side="right")

    content_fr = ctk.CTkFrame(top, fg_color="transparent")
    content_fr.pack(fill="both", expand=True)
    render_cal()

# ─── Time Picker ───
def open_time_picker(parent, entry_widget):
    top = ctk.CTkToplevel(parent)
    top.title("Select Time")
    top.geometry("300x280")
    top.grab_set()
    x = parent.winfo_x() + (parent.winfo_width() - 300) // 2
    y = parent.winfo_y() + (parent.winfo_height() - 280) // 2
    top.geometry(f"+{x}+{y}")

    hour_var = ctk.StringVar(value="12")
    min_var = ctk.StringVar(value="00")

    ctk.CTkLabel(top, text="Select Time", font=("Verdana", 14, "bold"),
                 text_color="#0b1957").pack(pady=15)

    picker = ctk.CTkFrame(top, fg_color="transparent")
    picker.pack(pady=10)

    hour_box = ctk.CTkComboBox(picker, values=[f"{h:02d}" for h in range(24)],
                               variable=hour_var, width=80)
    hour_box.pack(side="left", padx=5)
    ctk.CTkLabel(picker, text=":", font=("Verdana", 14)).pack(side="left")
    min_box = ctk.CTkComboBox(picker, values=[f"{m:02d}" for m in range(0,60,5)],
                             variable=min_var, width=80)
    min_box.pack(side="left", padx=5)

    def confirm():
        entry_widget.delete(0, "end")
        entry_widget.insert(0, f"{hour_var.get()}:{min_var.get()}")
        top.destroy()

    ctk.CTkButton(top, text="OK", command=confirm,
                  fg_color="#0b1957", height=35).pack(pady=15)

# ─── Create Event Form (Centered + Export Button) ───
def open_create_event_form():
    form = ctk.CTkToplevel(events_window)
    form.title("Create New Event")
    form.geometry("500x640")
    form.grab_set()
    # Center on main window
    events_window.update_idletasks()
    x = events_window.winfo_x() + (events_window.winfo_width() - 500) // 2
    y = events_window.winfo_y() + (events_window.winfo_height() - 640) // 2
    form.geometry(f"+{x}+{y}")

    ctk.CTkLabel(form, text="Create New Event", font=("Verdana", 18, "bold"),
                 text_color="#0b1957").pack(pady=20)

    ctk.CTkLabel(form, text="Event Name", font=("Verdana", 10, "bold")).pack(anchor="w", padx=40)
    name_entry = ctk.CTkEntry(form, width=420, height=40, placeholder_text="Enter event name")
    name_entry.pack(pady=(5, 15))

    ctk.CTkLabel(form, text="Event Date", font=("Verdana", 10, "bold")).pack(anchor="w", padx=40)
    date_row = ctk.CTkFrame(form, fg_color="transparent")
    date_row.pack(pady=(5, 15))
    date_entry = ctk.CTkEntry(date_row, width=340, height=40, placeholder_text="YYYY-MM-DD")
    date_entry.pack(side="left")
    ctk.CTkButton(date_row, text="📅", width=60, height=40,
                  command=lambda: open_calendar_picker(form, date_entry)).pack(side="left", padx=5)

    ctk.CTkLabel(form, text="Event Time", font=("Verdana", 10, "bold")).pack(anchor="w", padx=40)
    time_row = ctk.CTkFrame(form, fg_color="transparent")
    time_row.pack(pady=(5, 15))
    time_entry = ctk.CTkEntry(time_row, width=340, height=40, placeholder_text="HH:MM")
    time_entry.pack(side="left")
    ctk.CTkButton(time_row, text="🕐", width=60, height=40,
                  command=lambda: open_time_picker(form, time_entry)).pack(side="left", padx=5)

    ctk.CTkLabel(form, text="Description", font=("Verdana", 10, "bold")).pack(anchor="w", padx=40)
    desc_entry = ctk.CTkEntry(form, width=420, height=40, placeholder_text="Brief description")
    desc_entry.pack(pady=(5, 15))

    ctk.CTkLabel(form, text="Max Guests", font=("Verdana", 10, "bold")).pack(anchor="w", padx=40)
    max_entry = ctk.CTkEntry(form, width=420, height=40, placeholder_text="e.g. 100")
    max_entry.pack(pady=(5, 15))

    # ─── EXPORT GUEST LIST BUTTON INSIDE FORM ───
    ctk.CTkLabel(form, text="Quick Actions", font=("Verdana", 10, "bold"),
                 text_color="#555").pack(anchor="w", padx=40, pady=(10, 5))
    
    export_btn = ctk.CTkButton(
        form, 
        text="📤 Export Guest List",
        fg_color="#e8f5e9", 
        text_color="#2e7d32",
        hover_color="#c8e6c9",
        height=36,
        font=("Verdana", 10, "bold"),
        command=lambda: export_guest_list(
            name_entry.get().strip() or "New_Event", 
            []
        )
    )
    export_btn.pack(fill="x", padx=40, pady=(0, 20))

    def submit_event():
        name = name_entry.get().strip()
        date_str = date_entry.get().strip()
        time_str = time_entry.get().strip()
        desc = desc_entry.get().strip()
        max_guests = max_entry.get().strip()

        if not all([name, date_str, time_str, max_guests]):
            messagebox.showwarning("⚠️ Missing Fields", "Please fill all required fields!")
            return
        try:
            dt_obj = datetime.strptime(date_str, "%Y-%m-%d")
            datetime.strptime(time_str, "%H:%M")
        except ValueError:
            messagebox.showerror("❌ Invalid Format", "Use calendar & time pickers!")
            return
        try:
            max_guests = int(max_guests)
        except ValueError:
            messagebox.showerror("❌ Invalid Input", "Max guests must be a number!")
            return

        event_id = str(uuid.uuid4())[:8]
        month_name = dt_obj.strftime("%B %Y")
        display_date = dt_obj.strftime("%b\n%d")
        rsvp_link = generate_rsvp_link(event_id)

        new_event = {
            "id": event_id, "month": month_name, "date": display_date, "raw_date": date_str,
            "title": name, "desc": desc or "No description provided",
            "RSVP": f"0 / {max_guests}", "status": "Upcoming",
            "time": time_str, "rsvp_link": rsvp_link, "guests": []
        }
        save_event(new_event)
        all_events.insert(0, new_event)
        refresh_event_list()
        messagebox.showinfo("✅ Event Created!",
                           f"Event: {name}\nDate: {date_str} {time_str}\n\n🔗 RSVP Link:\n{rsvp_link}")
        form.destroy()

    ctk.CTkButton(form, text="Create Event", command=submit_event,
                  fg_color="#0b1957", hover_color="#101d6b", height=40,
                  font=("Verdana", 12, "bold")).pack(pady=5)

# ─── Edit Event Form ───
def open_edit_form(event_data, index):
    form = ctk.CTkToplevel(events_window)
    form.title("Edit Event")
    form.geometry("500x640")
    form.grab_set()
    x = events_window.winfo_x() + (events_window.winfo_width() - 500) // 2
    y = events_window.winfo_y() + (events_window.winfo_height() - 640) // 2
    form.geometry(f"+{x}+{y}")

    ctk.CTkLabel(form, text="Edit Event", font=("Verdana", 18, "bold"),
                 text_color="#0b1957").pack(pady=20)

    name_entry = ctk.CTkEntry(form, width=420, height=40)
    name_entry.insert(0, event_data["title"])
    name_entry.pack(pady=(5, 15))

    date_row = ctk.CTkFrame(form, fg_color="transparent")
    date_row.pack(pady=(5, 15))
    date_entry = ctk.CTkEntry(date_row, width=340, height=40)
    try: date_entry.insert(0, event_data["raw_date"])
    except: pass
    date_entry.pack(side="left")
    ctk.CTkButton(date_row, text="📅", width=60, height=40,
                  command=lambda: open_calendar_picker(form, date_entry)).pack(side="left", padx=5)

    time_row = ctk.CTkFrame(form, fg_color="transparent")
    time_row.pack(pady=(5, 15))
    time_entry = ctk.CTkEntry(time_row, width=340, height=40)
    time_entry.insert(0, event_data.get("time", ""))
    time_entry.pack(side="left")
    ctk.CTkButton(time_row, text="🕐", width=60, height=40,
                  command=lambda: open_time_picker(form, time_entry)).pack(side="left", padx=5)

    desc_entry = ctk.CTkEntry(form, width=420, height=40)
    desc_entry.insert(0, event_data["desc"])
    desc_entry.pack(pady=(5, 15))

    status_menu = ctk.CTkOptionMenu(form, values=["Upcoming", "Ongoing", "Completed"],
                                     fg_color="#e9e9eb", button_color="#0b1957")
    status_menu.set(event_data["status"])
    status_menu.pack(pady=10)

    # ─── EXPORT GUEST LIST BUTTON IN EDIT FORM ───
    ctk.CTkLabel(form, text="Quick Actions", font=("Verdana", 10, "bold"),
                 text_color="#555").pack(anchor="w", padx=40, pady=(10, 5))
    
    export_btn = ctk.CTkButton(
        form, 
        text="📤 Export Guest List",
        fg_color="#e8f5e9", 
        text_color="#2e7d32",
        hover_color="#c8e6c9",
        height=36,
        font=("Verdana", 10, "bold"),
        command=lambda: export_guest_list(event_data["title"], event_data.get("guests", []))
    )
    export_btn.pack(fill="x", padx=40, pady=(0, 20))

    def save():
        name = name_entry.get().strip()
        date_str = date_entry.get().strip()
        time_str = time_entry.get().strip()
        desc = desc_entry.get().strip()
        status = status_menu.get()
        if not all([name, date_str, time_str]):
            messagebox.showwarning("⚠️ Missing Fields", "Name, Date, and Time are required!")
            return
        try:
            dt_obj = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            messagebox.showerror("❌ Invalid Date", "Use calendar picker!")
            return
        conn = sqlite3.connect("em_events.db")
        c = conn.cursor()
        c.execute("""UPDATE events SET title=?, description=?, date=?, time=?, status=?,
                   month_display=?, day_display=? WHERE id=?""",
                  (name, desc, date_str, time_str, status,
                   dt_obj.strftime("%B %Y"), dt_obj.strftime("%b\n%d"), event_data["id"]))
        conn.commit()
        conn.close()
        all_events[index].update({
            "title": name, "desc": desc, "raw_date": date_str, "time": time_str,
            "month": dt_obj.strftime("%B %Y"), "date": dt_obj.strftime("%b\n%d"), "status": status
        })
        refresh_event_list()
        messagebox.showinfo("✅ Updated", "Event saved!")
        form.destroy()

    ctk.CTkButton(form, text="Save Changes", command=save,
                  fg_color="#0b1957", height=40, font=("Verdana", 12, "bold")).pack(pady=5)

def confirm_delete(event_id, index):
    if messagebox.askyesno("⚠️ Delete", "Delete this event? Cannot undo!"):
        delete_event_db(event_id)
        all_events.pop(index)
        refresh_event_list()
        messagebox.showinfo("✅ Deleted", "Event removed.")

# ─── SIDEBAR ───
sidebar = ctk.CTkFrame(events_window, width=200, corner_radius=0, fg_color="#ffffe3")
sidebar.pack(side="left", fill="y")
sidebar.pack_propagate(False)

header = ctk.CTkFrame(sidebar, fg_color="transparent")
header.pack(padx=15, pady=(10, 10))
header.place(x=8, y=8)

logo_image = ctk.CTkImage(
    light_image=Image.open("logo.png"),
    dark_image=Image.open("logo.png"),
    size=(50, 50)
)
logo_place = ctk.CTkLabel(header, image=logo_image, text="", fg_color="transparent")
logo_place.pack(anchor="w", padx=10, pady=10)
logo_place.place(x=25, y=10)

logo_name = ctk.CTkLabel(header, text="EManage", font=("Garamond", 12, "bold"), text_color="#0b1957")
logo_name.pack(side="left", padx=23, pady=10)
logo_name.place(x=80, y=24)

menu_frame = ctk.CTkFrame(sidebar, fg_color="transparent")
menu_frame.pack(padx=10, pady=(80, 0), side="left", fill="both", expand=True)
menu_frame.place(x=20, y=90)

menu_items = [("⌂", "Dashboard"), ("▤", "Events"), ("♙", "Profile"), ("↪", "Logout")]
menu_rows = {}
icon_labels = {}
name_labels = {}
active_page = ["Events"]

def select_page(selected):
    active_page[0] = selected
    for name, row in menu_rows.items():
        if name == selected:
            row.configure(fg_color="#0b1957")
            icon_labels[name].configure(text_color="#f7f4ed")
            name_labels[name].configure(text_color="#f7f4ed")
        else:
            row.configure(fg_color="transparent")
            icon_labels[name].configure(text_color="#0b1957")
            name_labels[name].configure(text_color="#0b1957")

def on_hover(name):
    menu_rows[name].configure(fg_color="#101d6b")
    icon_labels[name].configure(text_color="#f7f4ed")
    name_labels[name].configure(text_color="#f7f4ed")

def on_leave(name):
    if active_page[0] == name:
        menu_rows[name].configure(fg_color="#0b1957")
    else:
        menu_rows[name].configure(fg_color="transparent")
        icon_labels[name].configure(text_color="#0b1957")
        name_labels[name].configure(text_color="#0b1957")

for icon, name in menu_items:
    row = ctk.CTkFrame(menu_frame, height=50, corner_radius=8, fg_color="transparent", width=160)
    row.pack(fill="x", pady=4)
    row.pack_propagate(False)
    il = ctk.CTkLabel(row, text=icon, font=("Segoe UI", 25), width=30, anchor="center")
    il.pack(side="left", padx=(8, 0))
    nl = ctk.CTkLabel(row, text=name, font=("Segoe UI", 12), anchor="w")
    nl.pack(side="left", padx=10)
    nl.place(x=50, y=13)
    for w in (row, il, nl):
        w.bind("<Enter>", lambda e, n=name: on_hover(n))
        w.bind("<Leave>", lambda e, n=name: on_leave(n))
        w.bind("<Button-1>", lambda e, n=name: select_page(n))
    menu_rows[name] = row
    icon_labels[name] = il
    name_labels[name] = nl

# ─── MAIN CONTENT ───
main_frame = ctk.CTkFrame(events_window, fg_color="#ffffe3", corner_radius=0)
main_frame.pack(side="left", fill="both", expand=True)

top_header = ctk.CTkFrame(main_frame, fg_color="#ffffe8", corner_radius=0, height=100)
top_header.pack(fill="x", padx=0, pady=(20, 20))
top_header.pack_propagate(False)

ctk.CTkLabel(top_header, text="Events", font=("Verdana", 25, "bold"),
             text_color="#0b1957").grid(row=0, column=0, padx=25, sticky="w")

search_visible = False
filter_visible = False
current_filter = ""
status_filter = "All"

sub_header = ctk.CTkFrame(main_frame, fg_color="white", corner_radius=5)
sub_header.pack(fill="x", padx=(23, 30), pady=(10, 5))

all_events_label = ctk.CTkLabel(sub_header, text="All events", font=ctk.CTkFont("verdana", 15, "bold"), text_color="#0b1957")
all_events_label.pack(side="left", padx=20, pady=15)

controls_container = ctk.CTkFrame(sub_header, fg_color="transparent")
controls_container.pack(side="right", padx=10)

create_btn = ctk.CTkButton(
    controls_container, text="+ Create Event", command=open_create_event_form,
    fg_color="#0b1957", hover_color="#101d6b", text_color="white", corner_radius=8,
    font=ctk.CTkFont("verdana", 12, "bold")
)
create_btn.pack(side="right", padx=5)

filter_group = ctk.CTkFrame(controls_container, fg_color="transparent")
filter_group.pack(side="right", padx=5)
filter_btn = ctk.CTkButton(
    filter_group, text="⚙", width=34, height=34,
    fg_color="transparent", text_color="#444", corner_radius=8, hover_color="#f0f0f0",
    font=ctk.CTkFont("verdana", 15)
)
filter_btn.pack(side="right")
filter_dropdown = ctk.CTkOptionMenu(
    filter_group, values=["All", "Ongoing", "Completed", "Upcoming"],
    command=lambda val: apply_status_filter(val),
    fg_color="#e9e9eb", button_color="#0b1957",
    font=ctk.CTkFont("verdana", 10), width=140, text_color="#5a5a55"
)
filter_dropdown.set("All")

search_group = ctk.CTkFrame(controls_container, fg_color="transparent")
search_group.pack(side="right", padx=5)
search_btn = ctk.CTkButton(
    search_group, text="🔍", width=34, height=34,
    fg_color="transparent", text_color="#444", corner_radius=8, hover_color="#f0f0f0",
    font=ctk.CTkFont("verdana", 15)
)
search_btn.pack(side="right")
search_entry = ctk.CTkEntry(search_group, placeholder_text="Search events...", width=200, height=36, corner_radius=8)

def apply_status_filter(selected_status):
    global status_filter
    status_filter = selected_status
    refresh_event_list()

def toggle_search():
    global search_visible
    if not search_visible:
        search_entry.pack(side="left", padx=(0, 6))
        search_entry.focus()
        search_visible = True
    else:
        search_entry.pack_forget()
        search_entry.delete(0, "end")
        global current_filter
        current_filter = ""
        refresh_event_list()
        search_visible = False

def toggle_filter():
    global filter_visible
    if not filter_visible:
        filter_dropdown.pack(side="left", padx=(0, 6))
        filter_visible = True
    else:
        filter_dropdown.pack_forget()
        filter_dropdown.set("All")
        apply_status_filter("All")
        filter_visible = False

search_btn.configure(command=toggle_search)
filter_btn.configure(command=toggle_filter)

def apply_filter(*args):
    global current_filter
    current_filter = search_entry.get().strip().lower()
    refresh_event_list()

search_entry.bind("<KeyRelease>", apply_filter)

# ─── Load Events ───
all_events = load_events()
if not all_events:
    all_events = [
        {"id": "evt001", "month": "January 2025", "date": "Jan\n23", "title": "Festival Joy",
         "desc": "Feel the magic of Festival Joy!", "raw_date": "2025-01-23", "time": "14:00",
         "RSVP": "18 / 20", "status": "Upcoming", "rsvp_link": generate_rsvp_link("evt001"), "guests": []},
        {"id": "evt002", "month": "February 2025", "date": "Feb\n14", "title": "Valentine Gala",
         "desc": "A night of love and celebration ❤️", "raw_date": "2025-02-14", "time": "18:30",
         "RSVP": "40 / 100", "status": "Ongoing", "rsvp_link": generate_rsvp_link("evt002"), "guests": []},
    ]

scroll_frame = ctk.CTkScrollableFrame(main_frame, fg_color="transparent", label_text="")
scroll_frame.pack(fill="both", expand=True, padx=30, pady=(0, 20))

def create_event_row(event_data, index):
    row = ctk.CTkFrame(scroll_frame, fg_color="#ffffff", corner_radius=12)
    row.pack(fill="x", pady=5, padx=5)
    for col in range(6):
        row.grid_columnconfigure(col, weight=0)
    row.grid_columnconfigure(2, weight=1)

    # Headers
    ctk.CTkLabel(row, text="").grid(row=0, column=0, padx=5, pady=(12, 0))
    ctk.CTkLabel(row, text="").grid(row=0, column=1, padx=5, pady=(12, 0))
    ctk.CTkLabel(row, text="").grid(row=0, column=2, padx=5, pady=(12, 0))
    ctk.CTkLabel(row, text="RSVP", font=ctk.CTkFont("verdana", 9, "bold"),
                 text_color="#999", width=130, anchor="center"
                 ).grid(row=0, column=3, padx=5, pady=(12, 0))
    ctk.CTkLabel(row, text="Status", font=ctk.CTkFont("verdana", 9, "bold"),
                 text_color="#999", width=130, anchor="center"
                 ).grid(row=0, column=4, padx=5, pady=(12, 0))
    ctk.CTkLabel(row, text="Actions", font=ctk.CTkFont("verdana", 9, "bold"),
                 text_color="#999", width=100, anchor="center"
                 ).grid(row=0, column=5, padx=5, pady=(12, 0))

    # Date
    ctk.CTkLabel(row, text=event_data["date"],
                 font=ctk.CTkFont("verdana", 11, "bold"),
                 text_color="#d62828", width=60, anchor="center"
                 ).grid(row=1, column=0, padx=(15, 5), pady=(5, 15))

    # Icon
    ctk.CTkLabel(row, text="🎨", width=44, height=44,
                 fg_color="#f5f5f5", corner_radius=8
                 ).grid(row=1, column=1, padx=5, pady=(5, 15))

    # Info
    info_frame = ctk.CTkFrame(row, fg_color="transparent")
    info_frame.grid(row=1, column=2, padx=5, pady=(5, 15), sticky="w")
    ctk.CTkLabel(info_frame, text=event_data["title"],
                 font=ctk.CTkFont("verdana", 12, "bold")).pack(anchor="w")
    ctk.CTkLabel(info_frame, text=event_data["desc"],
                 font=ctk.CTkFont("verdana", 9), text_color="#777").pack(anchor="w")

    # Copy Link Button
    if "rsvp_link" in event_data and event_data["rsvp_link"]:
        ctk.CTkButton(info_frame, text="📋 Copy RSVP Link",
                      command=lambda: copy_link(event_data),
                      fg_color="#e8eaf6", text_color="#0b1957", hover_color="#d0d4f0",
                      height=28, font=("Verdana", 9, "bold")).pack(pady=(8, 0))

    # RSVP Circle
    try:
        done, total = map(int, event_data["RSVP"].split(" / "))
    except:
        done, total = 0, 1
    percent = int(done / total * 100)
    circle_img = create_circular_progress(percent)
    rsvp_frame = ctk.CTkFrame(row, fg_color="transparent")
    rsvp_frame.grid(row=1, column=3, padx=5, pady=(5, 15))
    ctk.CTkLabel(rsvp_frame, image=circle_img, text="").pack(side="left", padx=(0, 8))
    ctk.CTkLabel(rsvp_frame, text=event_data["RSVP"],
                 font=ctk.CTkFont("verdana", 10)).pack(side="left")

    # Status
    ctk.CTkLabel(row, text=event_data["status"],
                 fg_color="#f0f0f0", corner_radius=12,
                 font=ctk.CTkFont("verdana", 9, "bold"),
                 width=130, anchor="center"
                 ).grid(row=1, column=4, padx=5, pady=(5, 15))

    # Actions
    actions = ctk.CTkFrame(row, fg_color="transparent", width=100)
    actions.grid(row=1, column=5, padx=5, pady=(5, 15))
    ctk.CTkButton(actions, image=edit_img, text="", width=32, height=32,
                  fg_color="transparent", hover_color="#f0f0f0", corner_radius=6,
                  command=lambda idx=index: open_edit_form(event_data, idx)
                  ).pack(side="left", padx=2)
    ctk.CTkButton(actions, image=delete_img, text="", width=32, height=32,
                  fg_color="transparent", hover_color="#ffebee", corner_radius=6,
                  command=lambda idx=index: confirm_delete(event_data["id"], idx)
                  ).pack(side="left", padx=2)
    ctk.CTkButton(actions, text="📤", width=32, height=32,
                  fg_color="transparent", hover_color="#e8f5e9",
                  command=lambda: export_guest_list(event_data["title"], event_data.get("guests", []))
                  ).pack(side="left", padx=2)

def build_list(events_to_show):
    month_groups = {}
    for ev in events_to_show:
        month_groups.setdefault(ev["month"], []).append(ev)
    for month_name, month_events in month_groups.items():
        month_bar = ctk.CTkFrame(scroll_frame, fg_color="transparent")
        month_bar.pack(fill="x", pady=(25, 8))
        ctk.CTkLabel(month_bar, text=month_name,
                     font=ctk.CTkFont("verdana", 12, "bold"),
                     text_color="#555").pack(side="left")
        ctk.CTkButton(month_bar, text="Export CSV",
                      fg_color="transparent", text_color="#666",
                      hover_color="#e9e9eb", font=ctk.CTkFont("verdana", 10),
                      command=lambda m=month_name: export_guest_list(m, [])
                      ).pack(side="right")
        for idx, event in enumerate(month_events):
            original_index = all_events.index(event)
            create_event_row(event, original_index)
    if not events_to_show:
        ctk.CTkLabel(scroll_frame, text="No events found matching your search/filter.",
                     font=ctk.CTkFont("verdana", 12), text_color="#888").pack(pady=30)

def refresh_event_list():
    for widget in scroll_frame.winfo_children():
        widget.destroy()
    filtered = []
    for ev in all_events:
        matches_search = (
            not current_filter or
            current_filter in ev["title"].lower() or
            current_filter in ev["desc"].lower() or
            current_filter in ev["status"].lower() or
            current_filter in ev["date"].lower() or
            current_filter in ev["month"].lower()
        )
        matches_status = (status_filter == "All" or ev["status"] == status_filter)
        if matches_search and matches_status:
            filtered.append(ev)
    build_list(filtered)

refresh_event_list()
select_page("Events")
events_window.mainloop()