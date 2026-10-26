import customtkinter as ctk
from tkinter import messagebox
from PIL import Image
import calendar
from datetime import date

ctk.set_appearance_mode("light")

dashboard_window = ctk.CTk()
dashboard_window.geometry("1200x700+140+0")
dashboard_window.title("EM Dashboard")

sidebar = ctk.CTkFrame(dashboard_window,width=200,corner_radius=0,fg_color="#ffffe3")
sidebar.pack(side="left", fill="y")
sidebar.pack_propagate(False)

header = ctk.CTkFrame(sidebar,fg_color="transparent")
header.pack(padx=15, pady=(10, 10))
header.place(x=8,y=8)

logo_image = ctk.CTkImage(light_image=Image.open("logo.png"),dark_image=Image.open("logo.png"),
    size=(50, 50))
logo_place = ctk.CTkLabel(header,image=logo_image,text="",fg_color="transparent")
logo_place.pack(anchor="w", padx=10, pady=10)
logo_place.place(x=25, y=10)

logo_name = ctk.CTkLabel(header,text="EManage",font=("Garamond", 12, "bold"),text_color="#0b1957")
logo_name.pack(side="left",padx=23,pady=10)
logo_name.place(x=80,y=24)

menu_frame = ctk.CTkFrame(sidebar,fg_color="transparent")
menu_frame.pack(padx=10,pady=(80, 0),side="left",fill="both",expand=True)
menu_frame.place(x=20,y=90)

menu_items = [("⌂", "Dashboard"),("▤", "Events"),("♙", "Profile"),("↪","Logout")]

buttons = {}
icon_labels = {}
name_labels = {}
menu_rows = {}
active_page = ["Dashboard"]

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
    row = ctk.CTkFrame(menu_frame,height=50,corner_radius=8,fg_color="transparent",width=160)
    row.pack(fill="x", pady=4)
    row.pack_propagate(False)
    
    icon_label = ctk.CTkLabel(row,text=icon,font=("Segoe UI", 25),fg_color="transparent",width=30,
    anchor="center")
    icon_label.pack(side="left", padx=(8, 0))

    name_label = ctk.CTkLabel(row,text=name,font=("Segoe UI", 12),fg_color="transparent",anchor="w")
    name_label.pack(side="left", padx=10)
    name_label.place(x=50,y=13)

    for widget in (row, icon_label, name_label):
        widget.bind("<Enter>",lambda event, n=name: on_hover(n))
        widget.bind("<Leave>",lambda event, n=name: on_leave(n))
        widget.bind("<Button-1>",lambda event, n=name: select_page(n))
    menu_rows[name] = row
    buttons[name] = row
    icon_labels[name] = icon_label
    name_labels[name] = name_label

main_frame = ctk.CTkFrame(dashboard_window,fg_color="#ffffe3",corner_radius=0)
main_frame.pack(side="left",fill="both",expand=True)

top_header = ctk.CTkFrame(main_frame,fg_color="#ffffe8",corner_radius=0,height=100)
top_header.pack(fill="x", padx=0, pady=(20,20))
top_header.pack_propagate(False)

top_header.grid_columnconfigure(0, weight=1)
top_header.grid_columnconfigure(1, weight=2)
top_header.grid_columnconfigure(2, weight=1)

welcome_label = ctk.CTkLabel(top_header,text="Welcome Back!",font=("Verdana", 25, "bold"),
    text_color="#0b1957")
welcome_label.grid(row=0, column=0, padx=25, sticky="w")

search_entry = ctk.CTkEntry(top_header,placeholder_text="⌕  Search",width=220,height=30,
    corner_radius=5)
search_entry.grid(row=0, column=1, padx=15, sticky="ew")

add_event = ctk.CTkButton(top_header,text="+ Add Event",width=115,height=30,fg_color="#0b1957",
    hover_color="#101d6b",text_color="white",corner_radius=5,font=("Verdana", 12, "bold"))
add_event.grid(row=0, column=2, padx=30, sticky="e")

stats = ctk.CTkFrame(main_frame, fg_color="transparent")
stats.pack(fill="x", pady=(0, 12), padx=(0, 12))

for col in range(3):
    stats.grid_columnconfigure(col, weight=1)

def stat_card(parent, title, number, color):
    card = ctk.CTkFrame(parent, fg_color="white", corner_radius=18, height=130)
    card.grid_propagate(False)

    ctk.CTkLabel(card, text=number,font=("Verdana", 25, "bold"),text_color="#29232b"
    ).pack(anchor="w", padx=15, pady=(12, 0))

    ctk.CTkLabel(card, text=title,font=("Verdana", 12),text_color='#5a5a55'
    ).pack(anchor="w", padx=15, pady=(4, 4))
    return card

stat_card(stats, "Total Events", "50", "black").grid(row=0, column=0, sticky="ew", padx=(0, 8))
stat_card(stats, "Upcoming Events", "25", "black").grid(row=0, column=1, sticky="ew", padx=8)
stat_card(stats, "Completed Events", "25", "black").grid(row=0, column=2, sticky="ew", padx=(8, 0))

ongoing = ctk.CTkFrame(
    main_frame,
    fg_color="transparent",
    corner_radius=10,
)

ongoing.pack(side="left", fill="both", expand=True, padx=(0, 12))
ongoing.place(
    relx=0,
    rely=0.23,
    relwidth=0.64,
    relheight=0.33
)

ctk.CTkLabel(ongoing, text="Ongoing Events ⏱",font=("Verdana", 18, "bold"),text_color="#0b1957"
).pack(anchor="w", pady=(12,10), padx=20)

ctk.CTkButton(
    ongoing,
    text="View All",
    font=("Verdana", 9),
    text_color="#888888",
    fg_color="transparent",
    hover_color="#eeeeee",
    width=45,
    height=20,
    corner_radius=5,
).place(relx=0.890,rely=0.073)

events_container = ctk.CTkFrame(ongoing,fg_color="transparent")
events_container.pack(fill="x",padx=6, pady=5)

events_container.grid_columnconfigure(0, weight=1)
events_container.grid_columnconfigure(1, weight=1)

def event_card(parent, title, date_text, time_text, attendees,column):
    card = ctk.CTkFrame(events_container,fg_color="white",corner_radius=15,height=160,
        border_width=1,border_color="#0b1957")
    card.grid(row=0, column=column, sticky="ew", padx=6, pady=4)
    card.grid_propagate(False)

    ctk.CTkFrame(card, height=7, fg_color="white", corner_radius=5
    ).pack(fill="x", padx=10, pady=6)

    ctk.CTkLabel(card, text=title,font=("Verdana", 14, "bold"),text_color="black"
    ).pack(anchor="w", padx=12, pady=(4, 2))

    ctk.CTkLabel(card, text=date_text,font=("Verdana", 11), text_color="#5a5a55"
    ).pack(anchor="w", padx=12)

    ctk.CTkLabel(card, text=time_text,font=("Verdana", 11), text_color="#5a5a55"
    ).pack(anchor="w", padx=12, pady=2)

    ctk.CTkLabel(card, text=attendees,font=("Verdana", 11), text_color="#101d6b"
    ).pack(anchor="w", padx=12, pady=(4, 12))

event_card(
    ongoing, "F&J Wedding",
    "10 Aug, 2026", "10:15 AM - 12:30 PM", "142 Attendees", 0
)
event_card(
    ongoing, "Elianna's Birthday",
    "12 Aug, 2026", "8:30 AM - 3:30 PM", "80 Attendees",1
)

right = ctk.CTkFrame(main_frame, fg_color="transparent")
right.pack(side="right", fill="both", expand=True, padx=12)
right.place(relx=0.653,rely=0.240,relwidth=0.34,relheight=0.72)

calendar_card = ctk.CTkFrame(right,width=332,height=250,fg_color="transparent",corner_radius=18)

calendar_card.pack(fill="both",expand=True,padx=5,pady=0)

today = date.today()
current_year = today.year
current_month = today.month

calendar_top = ctk.CTkFrame(
    calendar_card,
    fg_color="transparent"
)
calendar_top.pack(fill="x", padx=5, pady=0)

ctk.CTkButton(
    calendar_top,
    text="<",
    width=28,
    height=25,
    fg_color="transparent",
    text_color="#0b1957",
    hover_color="#eeeeee",
    command=lambda: change_month(-1)
).pack(side="left")

calendar_header = ctk.CTkLabel(
    calendar_top,
    text="",
    font=("Verdana", 13, "bold"),
    text_color="#0b1957"
)
calendar_header.pack(side="left", expand=True)

ctk.CTkButton(
    calendar_top,
    text=">",
    width=28,
    height=25,
    fg_color="transparent",
    text_color="#0b1957",
    hover_color="#eeeeee",
    command=lambda: change_month(1)
).pack(side="right")

calendar_grid = ctk.CTkFrame(
    calendar_card,
    fg_color="transparent"
)
calendar_grid.pack(fill="x",
    padx=5,
    pady=5
)

def change_month(offset):
    global current_month, current_year

    current_month += offset

    if current_month > 12:
        current_month = 1
        current_year += 1
    elif current_month < 1:
        current_month = 12
        current_year -= 1

    update_calendar()

def update_calendar():
    calendar_header.configure(
        text=f"{calendar.month_name[current_month]}, {current_year}"
    )

    for widget in calendar_grid.winfo_children():
        widget.destroy()

    for col in range(7):
        calendar_grid.grid_columnconfigure(
            col, weight=1, uniform="days"
        )

    weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    for col, day_name in enumerate(weekdays):
        ctk.CTkLabel(
            calendar_grid,
            text=day_name,
            font=("Verdana", 9, "bold"),
            text_color="#0b1957"
        ).grid(
            row=0, column=col,
            sticky="nsew", padx=2, pady=0
        )

    month_days = calendar.monthcalendar(
        current_year, current_month
    )

    for row, week in enumerate(month_days, start=1):
        calendar_grid.grid_rowconfigure(row, weight=1)

        for col, day_num in enumerate(week):
            if day_num == 0:
                continue

            is_today = (
                day_num == today.day
                and current_month == today.month
                and current_year == today.year
            )

            ctk.CTkLabel(
                calendar_grid,
                text=str(day_num),
                font=("Verdana", 10),
                text_color="#ffffff" if is_today else "#0b1957",
                fg_color="#0b1957" if is_today else "transparent",
                corner_radius=10
            ).grid(
                row=row, column=col,
                sticky="nsew", padx=2, pady=0
            )

update_calendar()

upcoming = ctk.CTkFrame(main_frame, fg_color="white",corner_radius=10)
upcoming.pack(side="left", fill="both", expand=True, padx=12)
upcoming.place(relx=0,rely=0.58,relwidth=0.64,relheight=0.4)

ctk.CTkLabel(
    upcoming, text="Upcoming Events 🔔",
    font=("Verdana", 17, "bold"),
    text_color="#0b1957"
).pack(anchor="w", pady=12,padx=20)

ctk.CTkButton(
    upcoming,
    text="View All",
    font=("Verdana", 9),
    text_color="#888888",
    fg_color="transparent",
    hover_color="#eeeeee",
    width=45,
    height=20,
    corner_radius=5,
).place(relx=0.890,rely=0.073)

upcoming_scroll = ctk.CTkScrollableFrame(
    upcoming,
    fg_color="transparent",
    corner_radius=0,
    scrollbar_button_color="#b8b8c8",
    scrollbar_button_hover_color="#0b1957"
)
upcoming_scroll.pack(
    fill="both",
    expand=True,
    padx=8,
    pady=(0, 8)
)

def upcoming_event_card(parent, title, date_text, time_text):
    card = ctk.CTkFrame(
        parent,
        fg_color="white",
        corner_radius=10,
        height=70,
        border_width=1,
        border_color="#0b1957"
    )
    card.pack(fill="x", padx=5, pady=5)
    card.pack_propagate(False)

    ctk.CTkLabel(
        card,
        text=title,
        font=("Verdana", 11, "bold"),
        text_color="#0b1957"
    ).pack(anchor="w", padx=12, pady=(8, 0))

    ctk.CTkLabel(
        card,
         text=f"📅 {date_text}",
        font=("Verdana", 9),
        text_color="#777777"
    ).pack(anchor="w", padx=12)

    ctk.CTkLabel(
        card,
        text=f"🕒 {time_text}",
        font=("Verdana", 9),
        text_color="#777777"
    ).place(relx=0.25,rely=0.52)

upcoming_event_card(upcoming_scroll, "Design Workshop", "October 20, 2026",'9:00 AM - 11:00 AM')
upcoming_event_card(upcoming_scroll, "Team Meeting", "October 23, 2026",'10:00 AM - 12:00 NN')
upcoming_event_card(upcoming_scroll, "Creator Meetup", "October 28, 2026",'1:00 PM - 3:00 PM')
upcoming_event_card(upcoming_scroll, "Tech Conference", "November 2, 2026",'3:00 PM - 5:00 PM')
upcoming_event_card(upcoming_scroll, "Planning Session", "November 5, 2026",'6:00 PM - 8:00 PM')

notes_card = ctk.CTkFrame(right, fg_color="transparent", corner_radius=10)
notes_card.pack(fill="both", expand=True)
notes_card.place(relx=0.05,rely=0.47,relheight=0.50,relwidth=0.900)

ctk.CTkLabel(
    notes_card, text="📝 My Notes",
    font=("Verdana", 18, "bold"),
    text_color="#0b1957"
).pack(anchor="w", padx=15, pady=5)

ctk.CTkLabel(
    notes_card,
    text="Write reminders for your events.",
    font=("Verdana", 11),
    text_color="#5a5a55"
).pack(anchor="w", padx=15, pady=(0, 8))

notes_box = ctk.CTkTextbox(
    notes_card,
    height=100,
    corner_radius=10,
    border_width=1,
    border_color="#eee5d6",
    fg_color="#fffdf6",
    text_color="#29232b",
    font=("Verdana", 12)
)
notes_box.pack(fill="both", expand=True, padx=12, pady=(0, 10))
notes_box.insert("1.0", "• Prepare attendance list\n• Confirm event venue\n• Contact participants")

def save_notes():
    with open("event_notes.txt", "w", encoding="utf-8") as file:
        file.write(notes_box.get("1.0", "end-1c"))
    messagebox.showinfo("Notes", "Your notes have been saved!")

ctk.CTkButton(
    notes_card,
    text="Save Notes",
    height=35,
    corner_radius=10,
    fg_color="#0b1957",
    hover_color="#101d6b",
    text_color="#f7f4ed",
    command=save_notes
).pack(anchor="e", padx=12, pady=(0, 12))

select_page("Dashboard")

dashboard_window.mainloop()