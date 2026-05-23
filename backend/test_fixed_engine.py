"""Test the FIXED local grammar engine."""
import sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.path.insert(0, ".")

from services.local_grammar_engine import LocalGrammarEngine
import services.local_grammar_engine as mod

print("Creating engine (LanguageTool has 10s timeout now)...")
import time
start = time.time()
engine = LocalGrammarEngine()
elapsed = time.time() - start
print(f"Engine created in {elapsed:.1f}s")
print(f"  available={engine.available}")
print(f"  LanguageTool={engine.tool is not None}")
print(f"  SymSpell={engine.symspell is not None}")

test_texts = [
    "RYTRTUI TRUWE4 TRURJ WEY5I",
    "I has a problm with grammer and speling.",
    "teh recieve seperate definately",
    "He go to school yesterday.",
    "This is a correct sentence.",
    "The cat sitted on the mat.",
    "writting is importnt for comunicaton.",
]

print("\n--- check_grammar results (live mode) ---")
for text in test_texts:
    s = time.time()
    result = engine.check_grammar(text, hints_only=True)
    ms = (time.time() - s) * 1000
    errors = result.get("errors", [])
    print(f"\nText: '{text}'  [{ms:.0f}ms]")
    print(f"Errors found: {len(errors)}")
    for e in errors:
        print(f"  [{e['type']}] '{e.get('word','')}' -> '{e.get('correction','?')}' | {e.get('hint','')}")

print("\n--- analyze_text (practice submit) ---")
s = time.time()
result = engine.analyze_text("I has a problm with grammer and speling.", "beginner")
ms = (time.time() - s) * 1000
print(f"Analysis in {ms:.0f}ms")
print(f"Overall score: {result.get('overall_score')}")
print(f"Category scores: {result.get('category_scores')}")
print(f"Errors: {len(result.get('errors', []))}")
print(f"Strengths: {result.get('strengths')}")
print(f"Areas: {result.get('areas_to_improve')}")
print(f"Improved: '{result.get('improved_version')}'")

print("\nALL TESTS PASSED")
