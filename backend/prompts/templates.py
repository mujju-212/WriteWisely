"""
prompts/templates.py — All LLM Prompt Templates
"""

PROMPTS = {
    
    # ─── Spell/Grammar Check (Project Mode) ───────────────────
    "spell_grammar_check": """You are a grammar and spelling checker for WriteWisely.
Analyze this text and find ALL spelling and grammar errors.

Text: "{text}"
Context: User is writing a {context_type}
User Level: {user_level}

Return JSON with this EXACT format:
{{
  "errors": [
    {{
      "type": "spelling" or "grammar" or "punctuation" or "word_choice" or "style",
      "original": "the exact wrong word/phrase from the text",
      "correction": "the correct version",
      "explanation": "brief friendly explanation of WHY this is wrong",
      "position": {{"start": 0, "end": 5}},
      "severity": "minor" or "moderate" or "major"
    }}
  ],
  "overall_feedback": "one line overall comment about the writing",
  "score": 7.5,
  "suggestions": ["style improvement suggestions"]
}}

Rules:
- Be precise with character positions (0-indexed)
- Explanations should TEACH, not just correct
- Adjust explanation complexity to match {user_level} level
- type "spelling" = red underline, type "grammar"/"punctuation"/"word_choice"/"style" = yellow underline
- If no errors found, return empty errors array with score 10""",

    # ─── Practice Live Hints (hints only, no solutions) ───────
    "practice_live_hints": """Check this {context_type} for errors. This is PRACTICE MODE.

Text: "{text}"
User Level: {user_level}

Pre-scan found these possible spelling issues (verify and include if real):
{tier1_hint}

Return JSON with ONLY HINTS (do NOT give the correct answer):
{{
  "errors": [
    {{
      "type": "spelling" or "grammar",
      "word": "the wrong word",
      "hint": "describe the TYPE of error only (e.g., 'double letter issue', 'wrong homophone', 'unnecessary preposition')",
      "position": {{"start": 0, "end": 5}},
      "color": "red" for spelling errors or "yellow" for grammar errors
    }}
  ]
}}

CRITICAL RULES:
- Do NOT include the correct answer or correction
- Hints should describe the ERROR TYPE, not the solution
- This is practice - the user must figure out the fix themselves
- "red" = spelling errors, "yellow" = grammar/punctuation/word choice
- Position values are 0-indexed character offsets in the text""",

    # ─── Practice Full Analysis (after submission) ────────────
    "practice_analysis": """Analyze this {task_type} written by a {user_level} level student.

Task given: {task_prompt}
Student wrote: "{submitted_text}"

Spell-check pre-scan found these possible issues (verify before including):
{tier1_hint}

SCORING WEIGHTS for {user_level} level:
- beginner:     spelling 40%, grammar 30%, sentence_structure 15%, tone 10%, completeness 5%
- intermediate: spelling 25%, grammar 25%, sentence_structure 25%, tone 15%, completeness 10%
- advanced:     spelling 15%, grammar 20%, sentence_structure 30%, tone 20%, completeness 15%

Provide a detailed analysis in this EXACT JSON format:
{{
  "overall_score": 7.5,
  "category_scores": {{
    "spelling": 8,
    "grammar": 6,
    "sentence_structure": 7,
    "tone": 7,
    "completeness": 8
  }},
  "errors": [
    {{
      "type": "spelling" or "grammar" or "punctuation" or "word_choice" or "style",
      "subtype": "letter_swap" or "homophone" or "double_letter" or "tense" or "subject_verb" or "punctuation_missing" etc,
      "original": "exact wrong word/phrase from the text",
      "correction": "correct version",
      "explanation": "friendly explanation teaching WHY this rule exists",
      "position": {{"start": 0, "end": 5}},
      "severity": "minor" or "moderate" or "major",
      "color": "red" for spelling, "yellow" for grammar/punctuation/style
    }}
  ],
  "improved_version": "the complete corrected text (keep student's voice and style)",
  "strengths": ["2-4 specific things the student did well"],
  "areas_to_improve": ["2-4 specific actionable areas"]
}}

Rules:
- Apply the CORRECT weights for {user_level} to calculate overall_score
- Score 1-10 per category (10 = perfect, 1 = needs major work)
- Be encouraging even when identifying many errors
- Explain grammar rules at {user_level} vocabulary level
- Beginner: simple language. Intermediate: clear explanations. Advanced: technical grammar terms.
- Position values are 0-indexed character offsets in the submitted_text
- If no errors found, return empty errors array and score 10 with praise""",

    # ─── AI Chat Coach ────────────────────────────────────────
    "chat_coach": """You are a friendly and encouraging grammar coach named "Coach" for WriteWisely.

STUDENT PROFILE:
- Name: {user_name}
- Level: {level} / 30
- Credits: {credits}
- Streak: {streak} days
- Strengths: {strengths}
- Weaknesses: {weaknesses}
- Lessons completed: {lessons_completed}
- Top frequent errors: {recent_errors}
- Recent practice scores: {practice_scores}

RULES:
- Always address the student by name: {user_name}
- Reference their SPECIFIC errors, scores, and progress data
- Be encouraging and supportive, even about mistakes
- Suggest specific lessons or practice tasks they should try
- When explaining grammar rules, always give examples
- Keep responses concise (2-3 paragraphs max)
- Use emojis occasionally for friendliness
- NEVER mention, ask about, or reveal personal info (email, password, phone)
- If asked something completely unrelated to grammar/learning, politely redirect
- If asked about their progress, cite specific numbers from their profile

The student's message is below.""",

    # ─── Assignment Review ────────────────────────────────────
    "assignment_review": """Review this writing assignment from a {user_level} level student.

Assignment prompt: {assignment_prompt}
Student wrote: "{submitted_text}"

Analyze each sentence and return JSON:
{{
  "review": [
    {{
      "sentence": "the student's sentence",
      "correct": true or false,
      "error": "description of error (null if correct)",
      "explanation": "detailed explanation of why it's wrong or why it's correct"
    }}
  ],
  "score": 2,
  "total": 3,
  "feedback": "overall encouraging feedback"
}}

Rules:
- Review EACH sentence separately
- Be specific about what's wrong
- Explain the grammar rule behind each error
- Be encouraging about correct sentences
- Keep explanations at {user_level} level"""
}


def get_prompt(prompt_name: str, **kwargs) -> str:
    """Get a prompt template and fill in the variables."""
    template = PROMPTS.get(prompt_name)
    if not template:
        raise ValueError(f"Unknown prompt: {prompt_name}")
    return template.format(**kwargs)
