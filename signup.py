import customtkinter as ctk
from tkinter import messagebox
import re

ctk.set_appearance_mode("light")

def open_signup(login_window):  
    signup_window = ctk.CTkToplevel()
    signup_window.title('Sign Up')
    signup_window.geometry('500x600')

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

        messagebox.showinfo('Success', 'Account created!')
        go_back_to_login()

    def go_back_to_login():
        signup_window.destroy()
        login_window.deiconify() 

    signup_window.protocol("WM_DELETE_WINDOW", go_back_to_login)

    signup_frame = ctk.CTkFrame(signup_window, width=500, height=450,corner_radius=28, fg_color="#f7f4ed")
    signup_frame.pack(pady=30, padx=30)
    signup_frame.pack_propagate(False)
    signup_frame.place(relx=0.5, rely=0.5, anchor="center")

    signup_title = ctk.CTkLabel(signup_frame, text="Sign Up", text_color="#0b1957",
                                font=ctk.CTkFont("Georgia", 50, "bold"))
    signup_title.pack(pady=20)

    signup_name = ctk.CTkEntry(signup_frame, placeholder_text="Name", width=300, height=40,
        corner_radius=10, border_width=2)
    signup_name.pack(pady=(20, 10), padx=20)

    signup_email = ctk.CTkEntry(signup_frame, placeholder_text="Email", width=300, height=40,
        corner_radius=10, border_width=2)
    signup_email.pack(pady=(20, 10), padx=20)

    signup_password = ctk.CTkEntry(signup_frame, placeholder_text="Password", width=300, height=40,
        corner_radius=10, border_width=2, show="*")
    signup_password.pack(pady=20, padx=20)

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
    login_link.bind('<Button-1>', lambda e: go_back_to_login())