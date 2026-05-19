import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=".env")

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Warning: Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_KEY in backend/.env")
    exit(1)

if url.endswith("/rest/v1/"):
    url = url[:-9]
    
supabase: Client = create_client(url, key)

workers_data = [
    {"first_name": "Marcelo", "last_name": "Castillo Herrera", "rut": "11820662-2", "position": "Maestro Primera", "email": "marcelocastillo.h.7@gmail.com", "birth_date": "1982-01-01"},
    {"first_name": "Sergio", "last_name": "Farias Anabalon", "rut": "15019122-k", "position": "Administrador de contrato", "email": "operaciones.mecwel@gmail.com", "birth_date": "1996-01-01"},
    {"first_name": "Gabriel", "last_name": "Lineros Romero", "rut": "12413801-9", "position": "Supervisor", "email": "gabriel.lineros@gmail.com", "birth_date": "1975-01-01"},
    {"first_name": "Rodrigo", "last_name": "Norambuena Pizarro", "rut": "15813458-6", "position": "Electrico", "email": "rodrigo.la.fabiola.la.rocio@gmail.com", "birth_date": "1977-01-01"},
    {"first_name": "Sergio", "last_name": "Farias Zepeda", "rut": "21324896-0", "position": "Ayudante de maestro", "email": "fariasergio2003@gmail.com", "birth_date": "1973-01-01"},
    {"first_name": "Paul", "last_name": "Salazar Castillo", "rut": "18793492-3", "position": "Maestro", "email": "paulslazar1994@gmail.com", "birth_date": "1991-01-01"},
    {"first_name": "Luis", "last_name": "Lemus Tapia", "rut": "10148680-k", "position": "Mecanico", "email": "l.a.l.t.001@hotmail.com", "birth_date": "1980-01-01"},
    {"first_name": "Lisandro", "last_name": "Agudelo Giraldo", "rut": "25573739-2", "position": "Ayudante Eelectrico", "email": "lisandroalonso91@gmail.com", "birth_date": "1992-01-01"},
    {"first_name": "Camila", "last_name": "Rendic Zuleta", "rut": "17021067-0", "position": "APR", "email": "camilarendicapr@gmail.com", "birth_date": "1975-01-01"},
    {"first_name": "Juan Gabriel", "last_name": "Rodriguez Campos", "rut": "28907810-K", "position": "Maestro", "email": "Juangabrielrodriguezcampos02@gmail.com", "birth_date": "2002-01-01"},
    {"first_name": "Carmelo", "last_name": "Cristobal Pedreza", "rut": "24759544-9", "position": "Maestro", "email": "carmelocristobal83@gmail.com", "birth_date": None},
    {"first_name": "Marco", "last_name": "Moye", "rut": "23449699-9", "position": "Sin Especificar", "email": "maiky_84moye@hotmail.com", "birth_date": None}
]

print("Iniciando carga de datos...")
for w in workers_data:
    # Add default mandatory fields
    w["base_salary"] = 500000
    w["health_institution"] = "Fonasa"
    w["pension_fund"] = "AFP Modelo"
    w["status"] = "Active"

    try:
        response = supabase.table("workers").insert(w).execute()
        if response.data:
            print(f"OK Guardado: {w['first_name']} {w['last_name']}")
        else:
            print(f"WARN Posible error al guardar (sin datos retornados): {w['first_name']} {w['last_name']}")
    except Exception as e:
        print(f"ERROR al guardar {w['first_name']} {w['last_name']}: {str(e)}")

print("Carga finalizada.")
