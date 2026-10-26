import customtkinter as ctk
from tkinter import messagebox

ctk.set_appearance_mode("light")

newpass_window = ctk.CTk()
newpass_window.title('Create New Password')
newpass_window.geometry('500x600')

def show_password_new():
    if new_password.cget('show') == '*':
        new_password.configure(show='')
        toggle_button_newp.configure(text='🙈')
    else:
        new_password.configure(show='*')
        toggle_button_newp.configure(text='🙉')

def show_password_con():
    if confirm_password.cget('show') == '*':
        confirm_password.configure(show='')
        toggle_button_conp.configure(text='🙈')
    else:
        confirm_password.configure(show='*')
        toggle_button_conp.configure(text='🙉')

newpass_frame = ctk.CTkFrame(newpass_window, width=500, height=450,corner_radius=28, 
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
toggle_button_newp = ctk.CTkButton(newpass_frame, text="🙉", font=("arial", 18), width=7,
    fg_color="transparent", text_color="gray", hover=False,command=show_password_new)
toggle_button_newp.place(x=360, y=194)

confirm = ctk.CTkLabel(newpass_frame, text="Confirm New Password",text_color="#0b1957",
    font=ctk.CTkFont("Verdana", 11))
confirm.pack(pady=(10, 5))
confirm.place(relx=0.2, rely=0, x=0.5, y=253)
        
confirm_password = ctk.CTkEntry(newpass_frame, placeholder_text="", width=300, height=40,corner_radius=10, 
    border_width=2)
confirm_password.pack(pady=(30, 20), padx=20)
toggle_button_conp = ctk.CTkButton(newpass_frame, text="🙉", font=("arial", 18), width=7,
    fg_color="transparent", text_color="gray", hover=False,command=show_password_con)
toggle_button_conp.place(x=360, y=285)
        
newpass_button = ctk.CTkButton(newpass_frame, text="Save", width=300, height=40,corner_radius=20, 
    font=ctk.CTkFont("Verdana", 16, weight="bold"),text_color="#f7f4ed",fg_color="#0b1957",hover_color="#101d6b")
newpass_button.pack(pady=(20, 10))

newpass_window.mainloop()