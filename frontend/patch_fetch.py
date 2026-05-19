import os
import glob
import re

src_dir = r"c:\Users\Edzul\OneDrive\Desktop\camila\frontend\src"

# Process all jsx files in pages and components
for folder in ["pages", "components"]:
    folder_path = os.path.join(src_dir, folder)
    if not os.path.exists(folder_path): continue
    
    for filepath in glob.glob(os.path.join(folder_path, "*.jsx")):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        if "fetch('http://127.0.0.1:8000" in content or "fetch(`http://127.0.0.1:8000" in content:
            # Replace fetch( with apiFetch(
            content = content.replace("fetch('http://127.0.0.1:8000", "apiFetch('http://127.0.0.1:8000")
            content = content.replace("fetch(`http://127.0.0.1:8000", "apiFetch(`http://127.0.0.1:8000")
            
            # Determine path to supabaseClient based on folder
            import_path = "../supabaseClient" if folder == "pages" else "../supabaseClient"
            if folder == "components":
                import_path = "../supabaseClient" # same depth
                
            # Add import at the top
            import_statement = f"import {{ apiFetch }} from '{import_path}'\n"
            if "import { apiFetch }" not in content:
                content = import_statement + content
                
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)

print("Fetch calls patched successfully.")
