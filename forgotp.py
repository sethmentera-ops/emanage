import customtkinter as ctk
from tkinter import messagebox
import re


ctk.set_appearance_mode("light")

def open_forgotp(login_window):
    forgotp_window = ctk.CTkToplevel()
    forgotp_window.title('Forgot Password')
    forgotp_window.geometry('500x600')

    def valid_email(email):
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        return re.match(pattern, email)
    def send():
        email = forgotp_email.get()
        if not email:
            messagebox.showwarning('Empty Fields', 'Please fill in all fields')
            return
        if not valid_email(email):
            messagebox.showerror('Invalid', 'Invalid Email Format')
            return

    def go_back_to_login():
            forgotp_window.destroy()
            login_window.deiconify()
            
    forgotp_window.protocol("WM_DELETE_WINDOW", go_back_to_login)
    
    forgotp_frame = ctk.CTkFrame(forgotp_window, width=500, height=450,corner_radius=28, 
        fg_color="#f7f4ed")
    forgotp_frame.pack(pady=30, padx=30)
    forgotp_frame.pack_propagate(False)
    forgotp_frame.place(relx=0.5, rely=0.5, anchor="center")
    
    back_button = ctk.CTkButton(forgotp_frame,text="<",width=5,height=30,corner_radius=30, 
        fg_color="#f7f4ed",  text_color="black",font=ctk.CTkFont("Arial", 16, "bold"),
        hover_color="#d4c6b0",command=go_back_to_login)
    back_button.place(x=10, y=10)
    
    forgotp_title = ctk.CTkLabel(forgotp_frame, text="Forgot Password", text_color="#0b1957",
        font=ctk.CTkFont("Georgia", 40, "bold"))
    forgotp_title.pack(pady=(50,10))
    
    forgotp_note = ctk.CTkLabel(forgotp_frame, text="Please Enter your Email to Receive a Verification Code.", 
        text_color="#0b1957",font=ctk.CTkFont("Verdana", 15))
    forgotp_note.pack(pady=(20,30))
    
    email_label = ctk.CTkLabel(forgotp_frame, text="Email Address",text_color="#0b1957",
        font=ctk.CTkFont("Verdana", 11))
    email_label.pack(pady=(10, 5))
    email_label.place(relx=0.2, rely=0, x=0.5, y=190)
    
    forgotp_email = ctk.CTkEntry(forgotp_frame, placeholder_text="", width=300, height=40,
        corner_radius=10, border_width=2)
    forgotp_email.pack(pady=(35, 10), padx=20)
    
    forgotp_button = ctk.CTkButton(forgotp_frame, text="Send", width=300, 
        height=40,corner_radius=20, font=ctk.CTkFont("Verdana", 16, weight="bold"), 
        fg_color="#0b1957",text_color="#f7f4ed",hover_color="#101d6b",command=send)
    forgotp_button.pack(pady=(35, 30))