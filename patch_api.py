content = open(r'lib/api/index.ts', 'r', encoding='utf-8').read()
assert len(content) > 1000, f"File content too short: {len(content)} bytes"
lines = content.split('\n')
db_match_line = None
for i, line in enumerate(lines):
    if line.startswith('export type DbMatch ='):
        db_match_line = i
        break
if db_match_line is None:
    raise ValueError("DbMatch type declaration not found")
new_line = 'export type Match = DbMatch'
lines.insert(db_match_line + 1, new_line)
open(r'lib/api/index.ts', 'w', encoding='utf-8').write('\n'.join(lines))
print(f"Added 'export type Match = DbMatch' after line {db_match_line + 1}")