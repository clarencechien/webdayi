
import re

cin_path = '/home/clarencechien/webdayi/lite/data/dayi4.cin'
output_path = '/home/clarencechien/webdayi/lite/data/2code_words.txt'

targets = ['cz', 'v,', 'k.']
target_lines = {}
two_code_words = []

with open(cin_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('%'):
            continue
        
        parts = line.split()
        if len(parts) >= 2:
            code = parts[0]
            char = parts[1]
            
            # Check targets
            if code in targets:
                if code not in target_lines:
                    target_lines[code] = []
                target_lines[code].append(line)
            
            # Check 2-code words
            if len(code) == 2:
                two_code_words.append(f"{code} {char}")

print("--- Target Lines Found ---")
for code in targets:
    if code in target_lines:
        for l in target_lines[code]:
            print(l)

print(f"\n--- Total 2-code words: {len(two_code_words)} ---")

# Sort by code
two_code_words.sort()

with open(output_path, 'w', encoding='utf-8') as f:
    for word in two_code_words:
        f.write(word + '\n')

print(f"2-code words saved to {output_path}")
