import json
import os

def build_db():
    cin_path = '/home/clarencechien/webdayi/mvp2-predictive/data/dayi4.cin'
    freq_path = '/home/clarencechien/webdayi/mvp2-predictive/data/freq_map.json'
    output_path = '/home/clarencechien/webdayi/mvp2-predictive/data/dayi_db.json'

    # Load Frequencies
    print(f"Loading frequencies from {freq_path}...")
    freq_map = {}
    try:
        with open(freq_path, 'r', encoding='utf-8') as f:
            freq_map = json.load(f)
    except Exception as e:
        print(f"Warning: Could not load freq_map: {e}")

    # Parse CIN
    print(f"Parsing {cin_path}...")
    db = {}
    in_chardef = False
    
    with open(cin_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            
            if line == '%chardef begin':
                in_chardef = True
                continue
            if line == '%chardef end':
                in_chardef = False
                continue
            
            if in_chardef:
                # Format: code char
                parts = line.split()
                if len(parts) >= 2:
                    code = parts[0]
                    char = parts[1]
                    
                    if code not in db:
                        db[code] = []
                    
                    # Check for duplicates
                    if not any(c['char'] == char for c in db[code]):
                        # Get freq (default to 0 if not found)
                        freq = freq_map.get(char, 0)
                        db[code].append({
                            'char': char,
                            'freq': freq
                        })

    # Sort candidates by frequency
    print("Sorting candidates...")
    for code in db:
        db[code].sort(key=lambda x: x['freq'], reverse=True)

    # Save
    print(f"Saving to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
    
    print(f"Done. Total codes: {len(db)}")

if __name__ == "__main__":
    build_db()
