import re
with open('frontend/src/components/ListWidget.tsx', 'r') as f:
    content = f.read()

resolved = """                <span className="relative shrink-0" style={{ width: u(32), height: u(32) }}>
                  <div
                    className="absolute inset-0 rounded-full bg-[#DCDCDC]/20 dark:bg-white/10"
                    style={{
                      boxShadow: `${u(1.07)} ${u(0.53)} ${u(4.23)} 0 rgba(0, 0, 0, 0.07), inset ${u(-0.53)} 0 ${u(14.16)} ${u(7.42)} rgba(255, 255, 255, 0.52)`
                    }}"""

pattern = re.compile(r"<<<<<<< HEAD\n.*?>>>>>>> origin/main\n", re.DOTALL)
content = re.sub(pattern, resolved, content)

with open('frontend/src/components/ListWidget.tsx', 'w') as f:
    f.write(content)
