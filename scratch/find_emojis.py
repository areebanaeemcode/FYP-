import os, sys, unicodedata

def is_emoji(ch):
    code = ord(ch)
    if 0x1F300 <= code <= 0x1FAFF:
        return True
    if 0x2600 <= code <= 0x27BF:
        return True
    if 0x2300 <= code <= 0x23FF:
        return True
    if 0x2B50 <= code <= 0x2B55:
        return True
    if 0xFE00 <= code <= 0xFE0F:
        return True
    if unicodedata.category(ch) in ['So', 'Sk'] and code > 127:
        return True
    return False

results = {}
for root, dirs, files in os.walk('.'):
    if any(d in root for d in ['venv', 'venv310', '__pycache__', '.git', '.gemini']):
        continue
    for f in files:
        if f.endswith(('.html', '.js', '.py', '.css')):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8') as fh:
                    lines = fh.readlines()
                    for idx, line in enumerate(lines):
                        emojis = [c for c in line if is_emoji(c)]
                        if emojis:
                            results.setdefault(p, []).append((idx+1, ''.join(emojis), line.strip()[:100]))
            except Exception:
                pass

with open('scratch/emoji_report.txt', 'w', encoding='utf-8') as out:
    for path, matches in sorted(results.items()):
        out.write(f'=== {path} ({len(matches)} lines) ===\n')
        for line_no, ems, text in matches:
            out.write(f'  L{line_no}: [{ems}] {text}\n')
print(f"Total files with emojis: {len(results)}")
