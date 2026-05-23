"""Quick diagnostic to see what the local grammar engine actually does."""
import sys, os
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

print("=" * 60)
print("LOCAL GRAMMAR ENGINE DIAGNOSTIC")
print("=" * 60)

# 1. Check if dependencies are installed
print("\n[1] Checking dependencies...")
try:
    import language_tool_python
    print("   [OK] language_tool_python installed")
except ImportError:
    print("   [FAIL] language_tool_python NOT installed")
    language_tool_python = None

try:
    from symspellpy import SymSpell, Verbosity
    print("   [OK] symspellpy installed")
except ImportError:
    print("   [FAIL] symspellpy NOT installed")
    SymSpell = None

# 2. Try to initialize LanguageTool locally
print("\n[2] Initializing LanguageTool (local server)...")
lt_tool = None
if language_tool_python:
    try:
        lt_tool = language_tool_python.LanguageTool("en-US")
        print("   [OK] LanguageTool initialized successfully")
    except Exception as e:
        print(f"   [FAIL] LanguageTool init FAILED: {e}")

# 3. Try to initialize SymSpell
print("\n[3] Initializing SymSpell...")
sym = None
if SymSpell:
    try:
        from importlib import resources
        dictionary_path = resources.files("symspellpy").joinpath(
            "frequency_dictionary_en_82_765.txt"
        )
        sym = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)
        loaded = sym.load_dictionary(str(dictionary_path), term_index=0, count_index=1)
        if loaded:
            print("   [OK] SymSpell dictionary loaded")
        else:
            print("   [FAIL] SymSpell dictionary load returned False")
            sym = None
    except Exception as e:
        print(f"   [FAIL] SymSpell init FAILED: {e}")

# 4. Test LanguageTool with sample text
print("\n[4] Testing LanguageTool with misspelled text...")
test_texts = [
    "RYTRTUI TRUWE4 TRURJ WEY5I",
    "I has a problm with grammer.",
    "He go to school yesterday.",
    "teh recieve seperate definately",
    "This is a correct sentence.",
]

if lt_tool:
    for text in test_texts:
        matches = lt_tool.check(text)
        print(f"\n   Text: '{text}'")
        print(f"   Matches found: {len(matches)}")
        for m in matches[:5]:
            reps = list(m.replacements[:3]) if m.replacements else []
            print(f"     -> [{m.ruleId}] offset={m.offset} len={m.errorLength} "
                  f"msg='{m.message[:60]}' replacements={reps}")
else:
    print("   SKIPPED - LanguageTool not available")

# 5. Test SymSpell
print("\n[5] Testing SymSpell with misspelled words...")
test_words = ["rytrtui", "truwe", "trurj", "problm", "grammer", "recieve", "teh"]
if sym:
    for word in test_words:
        results = sym.lookup(word, Verbosity.CLOSEST, max_edit_distance=2, include_unknown=False)
        if results:
            best = results[0]
            print(f"   '{word}' -> '{best.term}' (distance={best.distance})")
        else:
            print(f"   '{word}' -> NO SUGGESTION")
else:
    print("   SKIPPED - SymSpell not available")

# 6. Test full engine
print("\n[6] Testing full LocalGrammarEngine...")
try:
    sys.path.insert(0, ".")
    from services.local_grammar_engine import get_engine
    engine = get_engine()
    print(f"   Engine available: {engine.available}")
    print(f"   LanguageTool loaded: {engine.tool is not None}")
    print(f"   SymSpell loaded: {engine.symspell is not None}")
    
    for text in test_texts:
        result = engine.check_grammar(text, hints_only=False)
        errors = result.get("errors", [])
        print(f"\n   Text: '{text}'")
        print(f"   Errors: {len(errors)}")
        for e in errors[:5]:
            print(f"     -> [{e['type']}] '{e.get('word','')}' -> '{e.get('correction','N/A')}' | {e.get('hint','')}")
except Exception as e:
    print(f"   [FAIL] Engine test FAILED: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("DIAGNOSTIC COMPLETE")
print("=" * 60)
