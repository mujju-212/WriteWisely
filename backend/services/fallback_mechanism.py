"""
fallback_mechanism.py — Fallback Spell Checking & Reliability Layer
Implements edit-distance (Levenshtein) algorithm
Triggers fallback when AI confidence is low or response fails
"""

from typing import Dict, List, Any, Tuple, Optional
import difflib

# ─── Edit Distance (Levenshtein Distance) ──────────────────────
class EditDistanceSpellChecker:
    """
    Fallback spell checker using edit distance algorithm
    Finds spelling mistakes by comparing with dictionary
    """
    
    def __init__(self, dictionary_file: str = None):
        """Initialize with dictionary"""
        self.dictionary = self._load_dictionary(dictionary_file)
        self.cache = {}  # LRU cache for suggestions
    
    def _load_dictionary(self, file_path: str = None) -> set:
        """Load dictionary of correct words"""
        
        # For now, use common words list
        # In production, would load from file
        common_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "from",
            "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
            "do", "does", "did", "will", "would", "could", "should", "can", "may",
            "write", "written", "writing", "correct", "grammar", "spelling", "word",
            "sentence", "paragraph", "text", "letter", "email", "essay", "document",
            "good", "great", "excellent", "poor", "bad", "wrong", "right", "correct",
            # Add more as needed
        }
        
        return common_words
    
    def check_word(self, word: str, max_distance: int = 2) -> Dict[str, Any]:
        """
        Check if word is correct and suggest corrections
        max_distance: maximum edit distance for suggestions (1-2 for typos)
        """
        
        word_lower = word.lower()
        
        # Check if word exists in dictionary
        if word_lower in self.dictionary:
            return {
                "is_correct": True,
                "word": word,
                "suggestions": []
            }
        
        # Find suggestions using edit distance
        suggestions = self._find_suggestions(word_lower, max_distance)
        
        return {
            "is_correct": False,
            "word": word,
            "suggestions": suggestions[:3],  # Top 3 suggestions
            "error_type": "spelling",
            "confidence": self._calculate_confidence(len(suggestions))
        }
    
    def _find_suggestions(self, word: str, max_distance: int) -> List[Tuple[str, int]]:
        """Find suggestion words within edit distance"""
        
        if word in self.cache:
            return self.cache[word]
        
        candidates = []
        
        for dict_word in self.dictionary:
            # Skip if too different in length
            if abs(len(word) - len(dict_word)) > max_distance + 1:
                continue
            
            distance = self._levenshtein_distance(word, dict_word)
            
            if distance <= max_distance:
                candidates.append((dict_word, distance))
        
        # Sort by distance
        candidates.sort(key=lambda x: (x[1], len(x[0])))
        
        # Cache result
        self.cache[word] = candidates[:5]
        
        return self.cache[word]
    
    def _levenshtein_distance(self, s1: str, s2: str) -> int:
        """
        Calculate Levenshtein distance between two strings
        Measures minimum edits (insert, delete, replace) needed
        """
        
        if len(s1) < len(s2):
            return self._levenshtein_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        # Create rows for DP table
        previous_row = range(len(s2) + 1)
        
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            
            for j, c2 in enumerate(s2):
                # Cost of insertions, deletions, or substitutions
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                
                current_row.append(min(insertions, deletions, substitutions))
            
            previous_row = current_row
        
        return previous_row[-1]
    
    def _calculate_confidence(self, suggestion_count: int) -> float:
        """Calculate confidence of correction"""
        
        if suggestion_count >= 3:
            return 0.9
        elif suggestion_count >= 1:
            return 0.7
        else:
            return 0.3
    
    def check_text(self, text: str) -> List[Dict[str, Any]]:
        """Check entire text for spelling errors"""
        
        words = text.split()
        errors = []
        
        for word in words:
            # Remove punctuation for checking
            clean_word = ''.join(c for c in word if c.isalpha())
            
            if clean_word:
                result = self.check_word(clean_word)
                if not result["is_correct"]:
                    errors.append({
                        **result,
                        "original_word": word,
                        "position": text.find(word)
                    })
        
        return errors


# ─── Fallback Strategy ───────────────────────────────────────────
class FallbackStrategy:
    """Manages fallback from LLM to edit-distance checker"""
    
    def __init__(self, llm_service, spell_checker):
        self.llm_service = llm_service
        self.spell_checker = spell_checker
    
    async def check_with_fallback(
        self,
        text: str,
        user_context: str = None
    ) -> Dict[str, Any]:
        """
        Try LLM first, fallback to spell checker if needed
        """
        
        result = {
            "text": text,
            "method": "llm",
            "errors": [],
            "success": False
        }
        
        try:
            # Try LLM first
            llm_result = await self.llm_service.check_text_with_context(text, user_context)
            
            if llm_result and llm_result.get("confidence", 0) > 0.7:
                result["method"] = "llm"
                result["errors"] = llm_result.get("errors", [])
                result["success"] = True
                return result
        
        except Exception as e:
            # LLM failed, log and fallback
            print(f"LLM failed: {e}, falling back to spell checker")
        
        # Fallback: Use spell checker
        try:
            spelling_errors = self.spell_checker.check_text(text)
            
            result["method"] = "fallback_spell_check"
            result["errors"] = spelling_errors
            result["success"] = True
            result["note"] = "Using fallback spell checker (LLM unavailable)"
            
            return result
        
        except Exception as e:
            result["success"] = False
            result["error"] = str(e)
            return result
    
    async def evaluate_llm_confidence(
        self,
        llm_response: Dict[str, Any]
    ) -> Tuple[bool, float]:
        """
        Evaluate if LLM response is reliable enough
        Returns: (is_reliable, confidence_score)
        """
        
        confidence = llm_response.get("confidence", 0.5)
        error_count = len(llm_response.get("errors", []))
        
        # Reliability checks
        checks = {
            "high_confidence": confidence > 0.8,
            "reasonable_error_count": 0 < error_count < 20,
            "has_structure": "errors" in llm_response,
            "has_explanations": all(
                e.get("explanation") for e in llm_response.get("errors", [])
            )
        }
        
        # If most checks pass, consider it reliable
        passed_checks = sum(checks.values())
        is_reliable = passed_checks >= 3
        
        return is_reliable, confidence


# ─── Confidence Scoring ─────────────────────────────────────────
class ConfidenceScorer:
    """Scores confidence in AI responses to trigger fallback when needed"""
    
    @staticmethod
    def score_grammar_response(response: Dict[str, Any]) -> float:
        """
        Score confidence in grammar checking response (0-1)
        """
        
        score = 0.5
        
        # Check 1: Has corrections
        if "errors" in response and len(response["errors"]) > 0:
            score += 0.1
        
        # Check 2: Errors have structure
        sample_error = response.get("errors", [{}])[0]
        if all(k in sample_error for k in ["original", "corrected", "explanation"]):
            score += 0.2
        
        # Check 3: Has confidence field
        if "confidence" in response:
            score *= response["confidence"]
        
        # Check 4: No errors dict means either perfect or failed
        if "errors" not in response:
            score = 0.3  # Lower confidence, might need fallback
        
        return min(1.0, score)
    
    @staticmethod
    def should_use_fallback(
        llm_response: Dict[str, Any],
        threshold: float = 0.6
    ) -> bool:
        """
        Determines if fallback mechanism should kick in
        """
        
        confidence = ConfidenceScorer.score_grammar_response(llm_response)
        
        return confidence < threshold or llm_response.get("error") is not None
