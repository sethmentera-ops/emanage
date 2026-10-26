import customtkinter as ctk
from tkinter import messagebox
import re
import sqlite3
from PIL import Image
import calendar
from datetime import date

ctk.set_appearance_mode("light")

window = ctk.CTk()
window.geometry("1200x700+140+0")
window.title("EM")

def create_database():
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    cursor.execute("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )""")

    conn.commit()
    conn.close()

create_database()

def show_login():
    signup_frame.place_forget()
    forgotp_frame.place_forget()
    newpass_frame.place_forget()
    login_frame.place(relx=0.5, rely=0.5, anchor="center")


def show_signup():
    login_frame.place_forget()
    forgotp_frame.place_forget()
    newpass_frame.place_forget()
    signup_frame.place(relx=0.5, rely=0.5, anchor="center")


def show_forgotp():
    login_frame.place_forget()
    signup_frame.place_forget()
    newpass_frame.place_forget()
    forgotp_frame.place(relx=0.5, rely=0.5, anchor="center")

def show_newpass():
    login_frame.place_forget()
    signup_frame.place_forget()
    forgotp_frame.place_forget()
    newpass_frame.place(relx=0.5,rely=0.5,anchor="center")

# LOGIN PAGE

attempts = 3

def perform_login():
    global attempts

    email = login_email.get().strip()
    password = login_password.get()

    if not email or not password:
        messagebox.showwarning(
            "Empty Fields",
            "Please fill in all fields.")
        return

    try:
        conn = sqlite3.connect("users.db")
        cursor = conn.cursor()

        cursor.execute("SELECT name, password FROM users WHERE email = ?",(email,))
        user = cursor.fetchone()
        conn.close()

    except sqlite3.Error as error:
        messagebox.showerror("Database Error",str(error))
        return

    if user and user[1] == password:
        name = user[0]
        messagebox.showinfo("Login Success",f"Welcome {name}!")
        return

    attempts -= 1

    messagebox.showerror(
        "Login Failed",
        f"Invalid credentials! {attempts} attempts left."
    )

    if attempts <= 0:
        login_button.configure(state="disabled")
        messagebox.showwarning(
            "Blocked",
            "Too many attempts! Closing EM..."
        )
        window.destroy()

def show_password():
    if login_password.cget('show') == '*':
        login_password.configure(show='')
        toggle_button.configure(text='🙈')
    else:
        login_password.configure(show='*')
        toggle_button.configure(text='🙉')

login_frame = ctk.CTkFrame(window, width=500, height=400, corner_radius=28, fg_color="#f7f4ed")
login_frame.pack(pady=30, padx=30)
login_frame.pack_propagate(False)
login_frame.place(relx=0.5, rely=0.5, anchor="center")

login_title = ctk.CTkLabel(login_frame, text="Login", text_color="#0b1957",
    font=ctk.CTkFont("Georgia", 50, weight="bold"))
login_title.pack(pady=20)

login_email = ctk.CTkEntry(login_frame, placeholder_text="Email", width=300, height=40,
    corner_radius=10, border_width=2)
login_email.pack(pady=20, padx=20)
email_icon = ctk.CTkLabel(login_email, text="✉", font=("arial", 25), text_color="gray")
email_icon.place(x=265, y=5)

login_password = ctk.CTkEntry(login_frame, placeholder_text="Password", width=300, height=40,
    corner_radius=10, border_width=2, show="*")
login_password.pack(pady=(20, 30), padx=20)

toggle_button = ctk.CTkButton(login_frame, text="🙉", font=("arial", 18), width=7,
    fg_color="transparent", text_color="gray", hover=False,command=show_password)
toggle_button.place(x=360, y=203)

forgot_password = ctk.CTkLabel(login_frame, text="Forgot password?", text_color="#0b1957",
    font=ctk.CTkFont("Verdana", 11, underline=True))
forgot_password.place(relx=0.5, rely=0, x=150, y=238, anchor="ne")
forgot_password.bind("<Button-1>",lambda event: show_forgotp())

login_button = ctk.CTkButton(login_frame, text="Login", width=300, height=40, corner_radius=20,
    font=ctk.CTkFont("Verdana", 16, weight="bold"),fg_color="#0b1957",
    text_color="#f7f4ed",hover_color="#101d6b",command=perform_login)
login_button.pack(pady=(20, 30))

sign_up = ctk.CTkLabel(login_frame, text="Don't have an Account yet? Sign up!",
        text_color="#0b1957", font=ctk.CTkFont("Verdana", 11, underline=True))
sign_up.place(relx=0.5, rely=0.90, anchor="center")
sign_up.bind("<Button-1>", lambda event: show_signup())

# SIGN UP PAGE

def valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email)

def signup():
    name = signup_name.get()
    email = signup_email.get()
    password = signup_password.get()
    check = terms_check.get()
    if not name or not email or not password:
        messagebox.showwarning('Empty Fields', 'Please fill in all fields')
        return
    if not valid_email(email):
        messagebox.showerror('Invalid', 'Invalid Email Format')
        return
    if not check:
        messagebox.showerror('Error', 'You must Agree to the Terms and Conditions.')
        return
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE email = ?",(email,))
    existing_user = cursor.fetchone()
    if existing_user:
        messagebox.showerror("Error","This email is already registered.")
        conn.close()
        return
    cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        (name, email, password))
    conn.commit()
    conn.close()
    messagebox.showinfo("Success","Account created successfully!")
    signup_name.delete(0, "end")
    signup_email.delete(0, "end")
    signup_password.delete(0, "end")
    terms_check.deselect()
    show_login()

def show_password():
    if signup_password.cget('show') == '*':
        signup_password.configure(show='')
        toggle_button.configure(text='🙈')
    else:
        signup_password.configure(show='*')
        toggle_button.configure(text='🙉')

signup_frame = ctk.CTkFrame(window, width=500, height=450,corner_radius=28, fg_color="#f7f4ed")
signup_frame.pack(pady=30, padx=30)
signup_frame.pack_propagate(False)
signup_frame.place(relx=0.5, rely=0.5, anchor="center")

signup_title = ctk.CTkLabel(signup_frame, text="Sign Up", text_color="#0b1957",
                                font=ctk.CTkFont("Georgia", 50, "bold"))
signup_title.pack(pady=20)

signup_name = ctk.CTkEntry(signup_frame, placeholder_text="Name", width=300, height=40,
    corner_radius=10, border_width=2)
signup_name.pack(pady=(20, 10), padx=20)
signup_icon = ctk.CTkLabel(signup_name, text="👤", font=("arial", 20), text_color="gray")
signup_icon.place(x=268, y=5)

signup_email = ctk.CTkEntry(signup_frame, placeholder_text="Email", width=300, height=40,
    corner_radius=10, border_width=2)
signup_email.pack(pady=(20, 10), padx=20)
email_icon = ctk.CTkLabel(signup_email, text="✉", font=("arial", 25), text_color="gray")
email_icon.place(x=265, y=6)

signup_password = ctk.CTkEntry(signup_frame, placeholder_text="Password", width=300, height=40,
    corner_radius=10, border_width=2, show="*")
signup_password.pack(pady=20, padx=20)

toggle_button = ctk.CTkButton(signup_frame, text="🙉", font=("arial", 18), width=7,
    fg_color="transparent", text_color="gray", hover=False,command=show_password)
toggle_button.place(x=360, y=263)

terms_check = ctk.CTkCheckBox(signup_frame, text='I agree to the terms and conditions',
    font=ctk.CTkFont("Verdana", 11), text_color="#0b1957",
    checkbox_width=20, checkbox_height=20)
terms_check.pack(pady=20)
terms_check.place(x=100, y=305)

signup_button = ctk.CTkButton(signup_frame, text="Sign up", width=300, height=40,
    corner_radius=20, font=ctk.CTkFont("Verdana", 16, weight="bold"),
    fg_color="#0b1957",text_color="#f7f4ed",hover_color="#101d6b", command=signup)
signup_button.pack(pady=(30, 30))

login_link = ctk.CTkLabel(signup_frame, text="Already have an Account? Login!",
                              text_color="#0b1957", font=ctk.CTkFont("Verdana", 11, underline=True))
login_link.place(relx=0.5, rely=0.92, anchor="center")
login_link.bind("<Button-1>", lambda event: show_login())

# FORGOT PASSWORD PAGE

def valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email)
def send():
    email = forgotp_email.get().strip()
    if not email:
        messagebox.showwarning('Empty Fields','Please enter your email.')
        return
    if not valid_email(email):
        messagebox.showerror('Invalid','Invalid Email Format')
        return

    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM users WHERE email = ?",(email,))
    user = cursor.fetchone()
    conn.close()
    if user is None:
        messagebox.showerror('Error','No account was found with this email.')
        return
    global reset_email
    reset_email = email
    messagebox.showinfo('Success','Email verified. You can now create a new password.')

    show_newpass()

forgotp_frame = ctk.CTkFrame(window, width=500, height=450,corner_radius=28, 
    fg_color="#f7f4ed")
forgotp_frame.pack(pady=30, padx=30)
forgotp_frame.pack_propagate(False)
forgotp_frame.place(relx=0.5, rely=0.5, anchor="center")
    
back_button = ctk.CTkButton(forgotp_frame,text="<",width=5,height=30,corner_radius=30, 
    fg_color="#f7f4ed",  text_color="black",font=ctk.CTkFont("Arial", 16, "bold"),
    hover_color="#d4c6b0",command=show_login)
back_button.place(x=10, y=10)
    
forgotp_title = ctk.CTkLabel(forgotp_frame, text="Forgot Password", text_color="#0b1957",
    font=ctk.CTkFont("Georgia", 40, "bold"))
forgotp_title.pack(pady=(50,10))
    
forgotp_note = ctk.CTkLabel(forgotp_frame, text="Please Enter your Email to Verification your Account.", 
    text_color="#0b1957",font=ctk.CTkFont("Verdana", 15))
forgotp_note.pack(pady=(20,30))
    
email_label = ctk.CTkLabel(forgotp_frame, text="Email Address",text_color="#0b1957",
    font=ctk.CTkFont("Verdana", 11))
email_label.pack(pady=(10, 5))
email_label.place(relx=0.2, rely=0, x=0.5, y=190)
    
forgotp_email = ctk.CTkEntry(forgotp_frame, placeholder_text="", width=300, height=40,
    corner_radius=10, border_width=2)
forgotp_email.pack(pady=(35, 10), padx=20)
    
forgotp_button = ctk.CTkButton(forgotp_frame, text="Verify", width=300, 
    height=40,corner_radius=20, font=ctk.CTkFont("Verdana", 16, weight="bold"), 
    fg_color="#0b1957",text_color="#f7f4ed",hover_color="#101d6b",command=send)
forgotp_button.pack(pady=(35, 30))

# NEW PASSWORD PAGE

def change_password():
    password = new_password.get()
    confirm = confirm_password.get()
    if not password or not confirm:
        messagebox.showwarning("Empty Fields","Please fill in all fields.")
        return
    if password != confirm:
        messagebox.showerror("Error","Passwords do not match.")
        return
    if len(password) < 6:
        messagebox.showwarning("Weak Password","Password must be at least 6 characters.")
        return
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password = ? WHERE email = ?",(password, reset_email))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        messagebox.showerror("Error","Unable to change password.")
        return
    conn.close()
    messagebox.showinfo("Success","Your password has been changed successfully!")

    new_password.delete(0, "end")
    confirm_password.delete(0, "end")
    show_login()


newpass_frame = ctk.CTkFrame(window, width=500, height=450,corner_radius=28, 
    fg_color="#f7f4ed")
newpass_frame.pack(pady=30, padx=30)
newpass_frame.pack_propagate(False)
newpass_frame.place(relx=0.5, rely=0.5, anchor="center")
        
back_button = ctk.CTkButton(newpass_frame,text="<",width=5,height=30,corner_radius=30, 
    fg_color="#f7f4ed",  text_color="black",font=ctk.CTkFont("Arial", 16, "bold"),
    hover_color="#d4c6b0")
back_button.place(x=10, y=10)
        
newpass_title = ctk.CTkLabel(newpass_frame, text="Create New Password", text_color="#0b1957",
            font=ctk.CTkFont("Georgia", 40, "bold"))
newpass_title.pack(pady=(50,5))
        
newpass_note = ctk.CTkLabel(newpass_frame, text="Please Enter New Password",
    text_color="#0b1957",font=ctk.CTkFont("Verdana", 15))
newpass_note.pack(pady=(10,10))
        
newpass_label = ctk.CTkLabel(newpass_frame, text="New Password",text_color="#0b1957",
    font=ctk.CTkFont("Verdana", 11))
newpass_label.pack(pady=(10, 5))
newpass_label.place(relx=0.2, rely=0, x=0.5, y=165)
        
new_password = ctk.CTkEntry(newpass_frame, placeholder_text="", width=300, height=40,corner_radius=10, 
    border_width=2)
new_password.pack(pady=(40, 20), padx=20)

confirm_label = ctk.CTkLabel(newpass_frame, text="Confirm New Password",text_color="#0b1957",
    font=ctk.CTkFont("Verdana", 11))
confirm_label.pack(pady=(10, 5))
confirm_label.place(relx=0.2, rely=0, x=0.5, y=253)
        
confirm_password = ctk.CTkEntry(newpass_frame, placeholder_text="", width=300, height=40,corner_radius=10, 
    border_width=2)
confirm_password.pack(pady=(30, 20), padx=20)
        
newpass_button = ctk.CTkButton(newpass_frame, text="Save", width=300, height=40,corner_radius=20, 
    font=ctk.CTkFont("Verdana", 16, weight="bold"),text_color="#f7f4ed",
    fg_color="#0b1957",hover_color="#101d6b",command=change_password)
newpass_button.pack(pady=(20, 10))

# DASHBOARD

show_login()

window.mainloop()