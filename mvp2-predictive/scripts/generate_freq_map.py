import json
import os

def extract_freq_map():
    input_path = '/home/clarencechien/webdayi/mvp2-predictive/data/ngram_pruned.json'
    output_path = '/home/clarencechien/webdayi/mvp2-predictive/data/freq_map.json'

    print(f"Reading from {input_path}...")
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'unigrams' in data:
            unigrams = data['unigrams']
            print(f"Found {len(unigrams)} unigrams.")
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(unigrams, f, ensure_ascii=False, indent=2)
            print(f"Successfully wrote to {output_path}")
        else:
            print("Error: 'unigrams' key not found in input file.")
            
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    extract_freq_map()
