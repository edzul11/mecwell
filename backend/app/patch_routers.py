import os
import glob
import re

routers_dir = r"c:\Users\Edzul\OneDrive\Desktop\camila\backend\app\routes"

for filepath in glob.glob(os.path.join(routers_dir, "*.py")):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "from ..database import supabase" not in content:
        continue
        
    # Replace database import
    content = content.replace("from ..database import supabase", "from ..database import get_db_client\nfrom supabase import Client")
    
    lines = content.split('\n')
    out_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("@router."):
            out_lines.append(line)
            i += 1
            if i < len(lines):
                def_line = lines[i]
                if "def " in def_line:
                    # find the closing parenthesis
                    # handle multiline defs (rare here, but possible)
                    parts = def_line.rsplit("):", 1)
                    if len(parts) == 2:
                        if parts[0].strip().endswith("("): # no params
                            new_def = parts[0] + "supabase: Client = Depends(get_db_client)):"
                        else: # has params
                            new_def = parts[0] + ", supabase: Client = Depends(get_db_client)):"
                        out_lines.append(new_def)
                    else:
                        out_lines.append(def_line)
                else:
                    out_lines.append(def_line)
        else:
            # check if Depends needs to be added to fastapi imports
            if line.startswith("from fastapi import"):
                if "Depends" not in line:
                    line = line.replace("from fastapi import", "from fastapi import Depends,")
            out_lines.append(line)
        i += 1
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(out_lines))

print("Routers patched successfully.")
