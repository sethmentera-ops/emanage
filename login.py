import customtkinter as ctk
from tkinter import messagebox
from signup import open_signup
from forgotp import open_forgotp

ctk.set_appearance_mode("light")

attempts = 3

def perform_login():
    global attempts
    email = login_email.get()
    password = login_password.get()
    if not email or not password:
        messagebox.showwarning('Empty Fields', 'Please fill in all fields')
        return
    if email == 'Jhean' and password == 'arigatou':
        messagebox.showinfo('Login Success', f'Welcome {email}')
    else:
        attempts -= 1
        messagebox.showerror('Login Failed', f'Invalid Credentials! {attempts} attempt left!')
        if attempts <= 0:
            login_button.configure(state=ctk.DISABLED)
            messagebox.showwarning('Blocked', 'Too many attempts! Closing EM...')
            window.destroy()

def show_password():
    if login_password.cget('show') == '*':
        login_password.configure(show='')
        toggle_button.configure(text='🙈')
    else:
        login_password.configure(show='*')
        toggle_button.configure(text='🙉')

def go_to_signup():
    window.withdraw() 
    open_signup(window) 

def go_to_forgotp():
    window.withdraw() 
    open_forgotp(window)   


window = ctk.CTk()
window.title("Login")
window.geometry("500x600+200+100")

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

toggle_button = ctk.CTkButton(login_frame, text="🙉", font=("arial", 20), width=7,
    fg_color="transparent", text_color="gray", hover=False,command=show_password)
toggle_button.place(x=360, y=200)

forgot_password = ctk.CTkLabel(login_frame, text="Forgot password?", text_color="#0b1957",
    font=ctk.CTkFont("Verdana", 11, underline=True))
forgot_password.place(relx=0.5, rely=0, x=150, y=238, anchor="ne")
forgot_password.bind('<Button-1>', lambda e: go_to_forgotp())

login_button = ctk.CTkButton(login_frame, text="Login", width=300, height=40, corner_radius=20,
    font=ctk.CTkFont("Verdana", 16, weight="bold"),fg_color="#0b1957",
    text_color="#f7f4ed",hover_color="#101d6b",command=perform_login)
login_button.pack(pady=(20, 30))

sign_up = ctk.CTkLabel(login_frame, text="Don't have an Account yet? Sign up!",
        text_color="#0b1957", font=ctk.CTkFont("Verdana", 11, underline=True))
sign_up.place(relx=0.5, rely=0.90, anchor="center")
sign_up.bind('<Button-1>', lambda event: go_to_signup())

window.mainloop()