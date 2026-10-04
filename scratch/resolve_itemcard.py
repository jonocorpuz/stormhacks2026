import re
with open('frontend/src/components/items/ItemCard.jsx', 'r') as f:
    content = f.read()

# Resolve first conflict (className)
resolved_classname = "      className={`w-full h-full relative buoyant ${editMode ? '[&_button:not(.card-action-btn)]:pointer-events-none [&_a]:pointer-events-none' : 'hover:scale-[1.012] hover:-translate-y-1 hover:-rotate-[0.5deg]'} ${"
content = re.sub(r"<<<<<<< HEAD\n.*?=======\n(.*?)\n>>>>>>> origin/main", lambda m: m.group(1).replace(" cursor-pointer", ""), content, count=1, flags=re.DOTALL)

# Remove the CardButton conflict block entirely
content = re.sub(r"<<<<<<< HEAD\n=======\n\nfunction CardButton.*?\n>>>>>>> origin/main\n", "", content, flags=re.DOTALL)

with open('frontend/src/components/items/ItemCard.jsx', 'w') as f:
    f.write(content)
