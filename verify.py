import customtkinter as ctk
from tkinter import messagebox

ctk.set_appearance_mode("light")

    
def button_enter(event):
    resend_button.configure(
    fg_color="#0b1957",
    text_color="#f7f4ed",
    hover_color="#101d6b"
)
def button_leave(event):
    resend_button.configure(
    fg_color="transparent",
    text_color="#0b1957",
    border_width=2,
    border_color="#0b1957"
)

verify_window = ctk.CTk()
verify_window.title('Verify Email')
verify_window.geometry('500x600')

verify_frame = ctk.CTkFrame(verify_window, width=500, height=450,corner_radius=28, 
    fg_color="#f7f4ed")
verify_frame.pack(pady=30, padx=30)
verify_frame.pack_propagate(False)
verify_frame.place(relx=0.5, rely=0.5, anchor="center")
        
back_button = ctk.CTkButton(verify_frame,text="<",width=5,height=30,corner_radius=30, 
    fg_color="#f7f4ed",  text_color="black",font=ctk.CTkFont("Arial", 16, "bold"),
    hover_color="#d4c6b0")
back_button.place(x=10, y=10)
        
verify_title = ctk.CTkLabel(verify_frame, text="Verify Your Email", text_color="#0b1957",
            font=ctk.CTkFont("Georgia", 40, "bold"))
verify_title.pack(pady=(50,10))
        
verify_note = ctk.CTkLabel(verify_frame, text="Please Enter the 4-Digit Verification Code.",
    text_color="#0b1957",font=ctk.CTkFont("Verdana", 15))
verify_note.pack(pady=(20,20))
        
verify_label = ctk.CTkLabel(verify_frame, text="Verification Code",text_color="#0b1957",
    font=ctk.CTkFont("Verdana", 11))
verify_label.pack(pady=(10, 5))
verify_label.place(relx=0.2, rely=0, x=0.5, y=185)
        
verify_code = ctk.CTkEntry(verify_frame, placeholder_text="", width=300, height=40,corner_radius=10, 
    border_width=2)
verify_code.pack(pady=(35, 10), padx=20)
        
verify_button = ctk.CTkButton(verify_frame, text="Verify", width=300, height=40,corner_radius=20, 
    font=ctk.CTkFont("Verdana", 16, weight="bold"),text_color="#f7f4ed",fg_color="#0b1957",hover_color="#101d6b")
verify_button.pack(pady=(20, 10))
        
resend_button = ctk.CTkButton(verify_frame, text="Resend", width=300, height=40,corner_radius=20, 
    font=ctk.CTkFont("Verdana", 16, weight="bold"),fg_color="#0b1957",text_color="#f7f4ed",
    hover_color="#101d6b")
resend_button.pack(pady=(20, 10))
resend_button.bind("<Enter>", button_enter)
resend_button.bind("<Leave>", button_leave)

verify_window.mainloop()