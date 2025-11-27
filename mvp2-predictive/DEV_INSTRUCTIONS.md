# Development Instructions for MVP2 (Predictive Engine)

**Objective**: Transform the static `lite/index.html` logic into a Predictive Engine.

**UX Requirement**: 
1. User types 'i' (Dayi code for '台').
2. System finds '台' is high freq. Show '台' as grey phantom text.
3. User types 'r' (2nd code for '台').
4. System confirms '台' (turns black).
5. System sees '台' was confirmed + user typed 'j' (next key).
6. System looks up Bigram('台', 'j*'). Finds '北' (jb).
7. Show '北' as phantom text.

**Technical constraints**:
- Must use `mvp2-predictive/index.html`.
- Keep dependencies minimal (no heavy build steps).
- Use `bigram_lite.json` for predictions.
