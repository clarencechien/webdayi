
cin_path = '/home/clarencechien/webdayi/lite/data/dayi4.cin'
targets = ['oj']

with open(cin_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        line = line.strip()
        if not line: continue
        parts = line.split()
        if len(parts) >= 1 and parts[0] in targets:
            print(f"{i}: {line}")
