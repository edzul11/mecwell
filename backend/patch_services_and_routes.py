import os
import glob
import re

backend_dir = r"c:\Users\Edzul\OneDrive\Desktop\camila\backend"
services_dir = os.path.join(backend_dir, "app", "services")
routes_dir = os.path.join(backend_dir, "app", "routes")

# 1. Patch Services
service_files = glob.glob(os.path.join(services_dir, "*_service.py"))
for filepath in service_files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "from app.database import supabase" in content:
        content = content.replace("from app.database import supabase", "from supabase import Client")
        
        lines = content.split('\n')
        out_lines = []
        for line in lines:
            if line.startswith("def "):
                # Extract function definition
                parts = line.rsplit("):", 1)
                if len(parts) == 2:
                    if parts[0].strip().endswith("("): # No params
                        new_line = parts[0] + "supabase: Client):"
                    else: # Has params
                        new_line = parts[0] + ", supabase: Client):"
                    out_lines.append(new_line)
                else:
                    out_lines.append(line)
            else:
                out_lines.append(line)
                
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(out_lines))

# 2. Patch Routes
route_files = [
    os.path.join(routes_dir, "expenses.py"),
    os.path.join(routes_dir, "inventory.py"),
    os.path.join(routes_dir, "ppe.py")
]

for filepath in route_files:
    if not os.path.exists(filepath): continue
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    lines = content.split('\n')
    out_lines = []
    for line in lines:
        if "_service." in line and "(" in line:
            # find the service call, e.g. return inventory_service.get_inventory_items()
            # replace ) with supabase) or , supabase)
            
            # Simple heuristic: find the last ')' in the line
            idx = line.rfind(")")
            if idx != -1:
                # check if there are arguments
                idx_open = line.rfind("(", 0, idx)
                if idx_open != -1:
                    args_content = line[idx_open+1:idx].strip()
                    if args_content == "":
                        line = line[:idx] + "supabase" + line[idx:]
                    else:
                        line = line[:idx] + ", supabase" + line[idx:]
        out_lines.append(line)
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(out_lines))

print("Services and Routes patched successfully.")
