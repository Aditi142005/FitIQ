import re
import sys

def check_jsx_tags(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simplistic JSX tag matching - not perfect, but good enough for finding the mismatch
    # Find all opening and closing tags.
    # Ignoring self-closing tags like <div /> and <img />
    tags = re.finditer(r'<(/?)(\w+|>)', content)
    
    stack = []
    
    for match in tags:
        is_closing = match.group(1) == '/'
        tag_name = match.group(2)
        
        # Skip tags inside comments or strings (rough approximation)
        # For a full file this might be tricky, so let's just focus on the lines we care about.
        pass

if __name__ == "__main__":
    check_jsx_tags("frontend/src/pages/Dashboard.jsx")
