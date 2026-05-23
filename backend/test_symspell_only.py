"""Test the engine with LanguageTool DISABLED to see if SymSpell works alone."""
import sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.path.insert(0, ".")

# Disable LanguageTool before importing the engine
import services.local_grammar_engine as mod
mod.language_tool_python = None  # Force LanguageTool off

from services.local_grammar_engine import LocalGrammarEngine

print("Creating engine with SymSpell ONLY (no LanguageTool)...")
engine = LocalGrammarEngine()
print(f"  available={engine.available}")
print(f"  tool (LanguageTool)={engine.tool}")
print(f"  symspell={engine.symspell is not None}")

test_texts = [
    "RYTRTUI TRUWE4 TRURJ WEY5I",
    "I has a problm with grammer and speling.",
    "teh recieve seperate definately",
    "He go to school yesterday.",
    "This is a correct sentence.",
]

print("\n--- check_grammar results ---")
for text in test_texts:
    result = engine.check_grammar(text, hints_only=False)
    errors = result.get("errors", [])
    print(f"\nText: '{text}'")
    print(f"Errors found: {len(errors)}")
    for e in errors:
        print(f"  [{e['type']}] '{e.get('word','')}' -> '{e.get('correction','N/A')}' | hint: {e.get('hint','')}")

print("\n--- analyze_text results ---")
result = engine.analyze_text("I has a problm with grammer and speling.", "beginner")
print(f"Overall score: {result.get('overall_score')}")
print(f"Category scores: {result.get('category_scores')}")
print(f"Errors: {len(result.get('errors', []))}")
print(f"Strengths: {result.get('strengths')}")
print(f"Areas to improve: {result.get('areas_to_improve')}")
print(f"Improved version: '{result.get('improved_version')}'")

print("\nDONE")
