import os
from fastapi import Request, HTTPException
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

def get_db_client(request: Request) -> Client:
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase credentials not found.")
        
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        # Return default client (will be blocked by RLS since anon key has no policies)
        return create_client(url, key)
        
    token = auth_header.split(" ")[1]
    
    # Create a new client instance injecting the user's JWT into the headers.
    # This tells Supabase to evaluate RLS policies against this user.
    options = ClientOptions(headers={"Authorization": f"Bearer {token}"})
    return create_client(url, key, options=options)

