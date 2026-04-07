"""
explanation_engine.py — Standardized Explanation Generation
Every correction includes: WHAT is wrong, WHY it's wrong, HOW to fix it
Creates teaching-focused feedback from AI responses
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime
from bson import ObjectId

# ─── Explanation Generator ─────────────────────────────────────
class ExplanationEngine:
    """
    Converts raw AI feedback into structured, educational explanations
    Ensures consistency across all correction types
    """
    
    def __init__(self, db):
        self.db = db
    
    async def generate_error_explanation(
        self,
        error_type: str,
        original_text: str,
        corrected_text: str,
        ai_explanation: str = None,
        user_level: str = "Intermediate"
    ) -> Dict[str, Any]:
        """
        Generates comprehensive error explanation with all 3 components:
        - WHAT is wrong
        - WHY it's wrong
        - HOW to fix it
        """
        
        explanation_template = {
            "error_type": error_type,
            "severity": self._calculate_severity(error_type),
            "original": original_text,
            "corrected": corrected_text,
            
            # WHAT: The problem
            "what": self._explain_what(error_type, original_text),
            
            # WHY: The reason it's wrong
            "why": self._explain_why(
                error_type,
                original_text,
                corrected_text,
                user_level
            ),
            
            # HOW: Step-by-step fix
            "how": self._explain_how(error_type, original_text, corrected_text),
            
            # Additional teaching materials
            "teaching_points": await self._get_teaching_points(error_type),
            "similar_mistakes": await self._find_similar_mistakes(error_type),
            "practice_examples": self._generate_practice_examples(error_type),
            
            # Metadata
            "confidence": 0.95,
            "generated_at": datetime.utcnow()
        }
        
        if ai_explanation:
            explanation_template["ai_insight"] = ai_explanation
        
        return explanation_template
    
    def _explain_what(self, error_type: str, original_text: str) -> str:
        """Explains WHAT is wrong in simple terms"""
        
        what_templates = {
            "spelling": f"'{original_text}' is misspelled. This word has incorrect letters or letter arrangement.",
            "grammar": f"'{original_text}' breaks a grammar rule. The structure or form is incorrect.",
            "punctuation": f"'{original_text}' is missing or has incorrect punctuation.",
            "tense": f"'{original_text}' uses the wrong verb tense. The time reference doesn't match the context.",
            "subject_verb_agreement": f"'{original_text}' has mismatched subject and verb. They don't agree in number.",
            "article": f"'{original_text}' uses the wrong or missing article (a, an, the).",
            "capitalization": f"'{original_text}' needs or shouldn't have capital letters.",
            "word_choice": f"'{original_text}' uses an incorrect or inappropriate word.",
            "style": f"'{original_text}' could be clearer or more concise.",
            "clarity": f"'{original_text}' is unclear or confusing."
        }
        
        return what_templates.get(error_type, f"'{original_text}' needs correction.")
    
    def _explain_why(
        self,
        error_type: str,
        original: str,
        corrected: str,
        user_level: str
    ) -> str:
        """Explains WHY the error matters"""
        
        why_base = {
            "spelling": "Correct spelling ensures your writing is professional and credible. Readers take you seriously when there are no spelling mistakes.",
            "grammar": "Grammar rules exist to make writing clear and professional. Breaking them can confuse readers or make you sound uneducated.",
            "punctuation": "Punctuation guides readers through your thoughts. Missing or wrong punctuation changes meaning and creates confusion.",
            "tense": "Tense tells readers WHEN something happens. Using the wrong tense confuses the timeline of events.",
            "subject_verb_agreement": "Subjects and verbs must match. When they don't, sentences sound wrong and are hard to understand.",
            "article": "Articles (a, an, the) specify whether something is new or known. Wrong articles make sentences awkward.",
            "capitalization": "Capital letters show importance and follow convention. Wrong capitalization looks unprofessional.",
            "word_choice": "Using the right word makes your message clear and precise. Wrong words can change meaning entirely.",
            "style": "Conciseness and clarity keep readers engaged. Wordy sentences lose attention.",
            "clarity": "Clear writing helps readers understand your message quickly. Unclear writing frustrates and confuses."
        }
        
        return why_base.get(error_type, "This correction improves your writing's clarity and professionalism.")
    
    def _explain_how(self, error_type: str, original: str, corrected: str) -> Dict[str, str]:
        """Explains HOW to fix it with step-by-step guidance"""
        
        steps = {
            "spelling": {
                "step_1": f"Identify: '{original}' looks different from standard spelling",
                "step_2": "Check: Use a dictionary or spell-checker",
                "step_3": f"Replace: Use '{corrected}' instead",
                "tip": "Sound it out slowly and compare with dictionary spelling"
            },
            "grammar": {
                "step_1": "Identify: Look for actions (verbs) and who's doing them (subjects)",
                "step_2": f"Check: In '{original}', the structure breaks standard rules",
                "step_3": f"Rewrite: Use '{corrected}' to follow the rule",
                "tip": "Say it aloud. Correct sentences usually sound right"
            },
            "tense": {
                "step_1": "Identify: When does this action happen? (past, present, future)",
                "step_2": f"Check: '{original}' uses wrong tense",
                "step_3": f"Fix: Use '{corrected}' to match the time context",
                "tip": "Ask 'When?' about the action and choose the right tense"
            },
            "punctuation": {
                "step_1": "Identify: Where are your thoughts breaking or connecting?",
                "step_2": f"Check: '{original}' needs punctuation here",
                "step_3": f"Add: Correct punctuation is '{corrected}'",
                "tip": "Pause where punctuation goes. Where you pause, add a punctuation mark"
            }
        }
        
        return steps.get(
            error_type,
            {
                "step_1": f"Identify the issue in '{original}'",
                "step_2": "Understand the rule",
                "step_3": f"Replace with '{corrected}'",
                "tip": "Review the rule and practice similar corrections"
            }
        )
    
    async def _get_teaching_points(self, error_type: str) -> List[str]:
        """Get cached teaching points from database"""
        
        teaching_db = await self.db.teaching_points.find_one(
            {"error_type": error_type}
        )
        
        if teaching_db:
            return teaching_db.get("points", [])
        
        # Fallback teaching points
        default_points = {
            "spelling": [
                "Contractions: it's = it is, they're = they are",
                "Common patterns: -tion, -sion, -ous endings",
                "Double letters: beginning, misspelled"
            ],
            "grammar": [
                "Subject-Verb-Object order in English",
                "Phrase vs. Clause differences",
                "Run-on sentences vs. fragments"
            ],
            "tense": [
                "Present: things happening now",
                "Past: things that already happened",
                "Future: things that will happen"
            ]
        }
        
        return default_points.get(error_type, [])
    
    async def _find_similar_mistakes(self, error_type: str) -> List[Dict]:
        """Find similar mistakes user made before"""
        # This would query from error_patterns
        return []
    
    def _generate_practice_examples(self, error_type: str) -> List[Dict]:
        """Generate practice examples for this error type"""
        
        examples = {
            "spelling": [
                {"wrong": "recieve", "correct": "receive", "remember": "I-before-E except after C"},
                {"wrong": "occured", "correct": "occurred", "remember": "Double C, double R"},
            ],
            "grammar": [
                {"wrong": "He go to school", "correct": "He goes to school", "rule": "Third person singular needs -s"},
                {"wrong": "She don't know", "correct": "She doesn't know", "rule": "Third person uses 'doesn't' not 'don't'"},
            ],
            "tense": [
                {"wrong": "Yesterday I go", "correct": "Yesterday I went", "rule": "Past time → past tense"},
                {"wrong": "I will go tomorrow and I eat lunch", "correct": "I will go tomorrow and I will eat lunch", "rule": "Keep tense consistent"},
            ]
        }
        
        return examples.get(error_type, [])
    
    def _calculate_severity(self, error_type: str) -> str:
        """Rate error severity: critical, high, medium, low"""
        
        severity_map = {
            "spelling": "medium",
            "capitalization": "low",
            "punctuation": "medium",
            "grammar": "high",
            "tense": "high",
            "subject_verb_agreement": "high",
            "clarity": "high",
            "word_choice": "medium",
            "style": "low",
            "article": "medium"
        }
        
        return severity_map.get(error_type, "medium")
    
    async def save_explanation(
        self,
        user_id: str,
        explanation: Dict[str, Any]
    ) -> str:
        """Save explanation to database for analytics and learning"""
        
        doc = await self.db.explanations.insert_one({
            "user_id": ObjectId(user_id),
            "error_type": explanation.get("error_type"),
            "original": explanation.get("original"),
            "corrected": explanation.get("corrected"),
            "explained_at": datetime.utcnow(),
            "full_explanation": explanation
        })
        
        return str(doc.inserted_id)


# ─── Explanation Formatter ──────────────────────────────────────
class ExplanationFormatter:
    """Formats explanations for display in UI"""
    
    @staticmethod
    def format_for_ui(explanation: Dict[str, Any]) -> Dict[str, Any]:
        """Convert explanation to UI-friendly format"""
        
        return {
            "correction": {
                "wrong": explanation["original"],
                "right": explanation["corrected"],
                "errorType": explanation["error_type"]
            },
            "teaching": {
                "what": explanation["what"],
                "why": explanation["why"],
                "how": explanation["how"].get("step_1", "") + " → " + explanation["how"].get("step_3", "")
            },
            "examples": explanation.get("practice_examples", [])[:2],
            "severity": explanation.get("severity", "medium"),
            "tip": explanation["how"].get("tip", "")
        }
    
    @staticmethod
    def format_for_chat(explanation: Dict[str, Any]) -> str:
        """Format explanation for chat display"""
        
        return f"""
**❌ Issue Found:** {explanation['original']}
**✅ Should be:** {explanation['corrected']}

**What's wrong?**
{explanation['what']}

**Why does it matter?**
{explanation['why']}

**How to fix it:**
{explanation['how'].get('step_1')}
→ {explanation['how'].get('step_3')}

💡 **Tip:** {explanation['how'].get('tip')}
"""
