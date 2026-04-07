"""
practice_intelligence.py — Intelligent Scoring & Adaptive Feedback
Generates scores for grammar, clarity, vocabulary
Creates detailed performance reports
Implements dynamic difficulty adjustment
"""

from typing import Dict, List, Any, Tuple
from datetime import datetime
from bson import ObjectId
import json

# ─── Practice Scorer ────────────────────────────────────────────
class PracticeScorer:
    """Calculates multi-dimensional scores for practice submissions"""
    
    def __init__(self, db):
        self.db = db
    
    async def score_submission(
        self,
        user_id: str,
        submission_text: str,
        errors_found: List[Dict],
        practice_type: str = "general"
    ) -> Dict[str, Any]:
        """
        Calculates comprehensive score across multiple dimensions:
        - Grammar Score (1-10)
        - Clarity Score (1-10)
        - Vocabulary Score (1-10)
        - Style Score (1-10)
        - Overall Score (1-10)
        """
        
        submission_length = len(submission_text.split())
        error_count = len(errors_found)
        
        # Calculate individual component scores
        grammar_score = self._calculate_grammar_score(error_count, submission_length)
        clarity_score = self._calculate_clarity_score(submission_text, errors_found)
        vocabulary_score = await self._calculate_vocabulary_score(user_id, submission_text)
        style_score = self._calculate_style_score(submission_text, submission_length)
        
        # Calculate overall weighted score
        overall_score = self._calculate_overall_score(
            grammar_score,
            clarity_score,
            vocabulary_score,
            style_score,
            practice_type
        )
        
        # Generate feedback
        feedback = self._generate_feedback(
            grammar_score,
            clarity_score,
            vocabulary_score,
            style_score,
            errors_found
        )
        
        # Determine performance level
        performance_level = self._classify_performance(overall_score)
        
        return {
            "scores": {
                "grammar": grammar_score,
                "clarity": clarity_score,
                "vocabulary": vocabulary_score,
                "style": style_score,
                "overall": overall_score
            },
            "word_count": submission_length,
            "error_count": error_count,
            "performance_level": performance_level,
            "feedback": feedback,
            "strengths": self._identify_strengths(grammar_score, clarity_score, vocabulary_score),
            "areas_to_improve": self._identify_weaknesses(grammar_score, clarity_score, vocabulary_score),
            "submitted_at": datetime.utcnow()
        }
    
    def _calculate_grammar_score(self, error_count: int, word_count: int) -> float:
        """
        Grammar score based on error density
        10 = perfect, 0 = many errors
        """
        if word_count == 0:
            return 5.0
        
        error_density = error_count / max(word_count, 1)  # errors per word
        
        # Scale: 0 errors = 10.0, 1 error per 10 words = 8.0, 1 per 5 words = 4.0
        if error_density == 0:
            return 10.0
        elif error_density < 0.05:  # < 1 per 20 words
            return 9.0
        elif error_density < 0.10:  # < 1 per 10 words
            return 8.0
        elif error_density < 0.15:
            return 6.0
        elif error_density < 0.20:
            return 4.0
        else:
            return max(1.0, 10.0 - (error_density * 30))  # Floor at 1.0
    
    def _calculate_clarity_score(
        self,
        text: str,
        errors_found: List[Dict]
    ) -> float:
        """
        Clarity score based on readability factors:
        - Average sentence length
        - Punctuation usage
        - Grammar errors (they hurt clarity)
        """
        sentences = text.split(".")
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return 5.0
        
        # Ideal sentence length: 10-20 words
        avg_sentence_length = len(text.split()) / len(sentences)
        
        # Calculate clarity factor (10 = ideal length, lower as deviation increases)
        if 10 <= avg_sentence_length <= 20:
            length_factor = 10.0
        elif 8 <= avg_sentence_length <= 25:
            length_factor = 9.0
        elif 5 <= avg_sentence_length <= 30:
            length_factor = 7.0
        else:
            length_factor = 5.0
        
        # Grammar errors reduce clarity
        grammar_errors = sum(1 for e in errors_found if e.get("type") == "grammar")
        clarity_reduction = min(grammar_errors * 0.5, 3.0)
        
        clarity_score = max(1.0, length_factor - clarity_reduction)
        return min(10.0, clarity_score)
    
    async def _calculate_vocabulary_score(self, user_id: str, text: str) -> float:
        """
        Vocabulary score based on:
        - Word variety (type/token ratio)
        - Use of advanced vocabulary
        - Compared to user's typical level
        """
        words = text.split()
        unique_words = set(word.lower() for word in words)
        
        if not words:
            return 5.0
        
        # Type/token ratio (higher = more variety)
        vocabulary_richness = len(unique_words) / len(words)
        
        # Scale richness to score
        if vocabulary_richness >= 0.7:  # Very varied
            base_score = 9.0
        elif vocabulary_richness >= 0.5:  # Good variety
            base_score = 7.5
        elif vocabulary_richness >= 0.3:  # Moderate variety
            base_score = 6.0
        else:
            base_score = 4.0
        
        # Check for advanced vocabulary markers (optional)
        advanced_vocab = self._detect_advanced_words(text)
        if advanced_vocab > 3:
            base_score = min(10.0, base_score + 1.5)
        
        return base_score
    
    def _calculate_style_score(self, text: str, word_count: int) -> float:
        """
        Style score based on:
        - Appropriate length for task
        - Sentence variety
        - Conciseness
        """
        # Very short or very long might indicate issues
        if word_count < 20:
            return 4.0  # Too short
        elif word_count > 1000:
            return 5.5  # Possibly too long
        
        sentences = text.split(".")
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if len(sentences) < 2:
            return 5.0
        
        sentence_lengths = [len(s.split()) for s in sentences]
        length_variance = max(sentence_lengths) - min(sentence_lengths)
        
        # Variety is good (variance shows mix of short and long sentences)
        if 5 <= length_variance <= 20:
            return 8.0
        elif 3 <= length_variance <= 25:
            return 7.0
        else:
            return 6.0
    
    def _calculate_overall_score(
        self,
        grammar: float,
        clarity: float,
        vocabulary: float,
        style: float,
        practice_type: str = "general"
    ) -> float:
        """
        Weighted overall score
        Weights vary by practice type
        """
        weights = {
            "grammar": {"grammar": 0.40, "clarity": 0.30, "vocabulary": 0.15, "style": 0.15},
            "clarity": {"grammar": 0.30, "clarity": 0.40, "vocabulary": 0.15, "style": 0.15},
            "vocabulary": {"grammar": 0.25, "clarity": 0.20, "vocabulary": 0.40, "style": 0.15},
            "general": {"grammar": 0.35, "clarity": 0.30, "vocabulary": 0.20, "style": 0.15}
        }
        
        weight_set = weights.get(practice_type, weights["general"])
        
        overall = (
            grammar * weight_set["grammar"] +
            clarity * weight_set["clarity"] +
            vocabulary * weight_set["vocabulary"] +
            style * weight_set["style"]
        )
        
        return round(overall, 1)
    
    def _classify_performance(self, score: float) -> str:
        """Classify performance level"""
        if score >= 9.0:
            return "Excellent"
        elif score >= 8.0:
            return "Very Good"
        elif score >= 7.0:
            return "Good"
        elif score >= 6.0:
            return "Satisfactory"
        elif score >= 5.0:
            return "Needs Work"
        else:
            return "Poor"
    
    def _generate_feedback(
        self,
        grammar: float,
        clarity: float,
        vocabulary: float,
        style: float,
        errors: List[Dict]
    ) -> Dict[str, str]:
        """Generate textual feedback for each score"""
        
        feedback = {}
        
        # Grammar feedback
        if grammar >= 9:
            feedback["grammar"] = "Excellent grammar! Very few errors."
        elif grammar >= 7:
            feedback["grammar"] = "Good grammar overall. A few minor corrections needed."
        elif grammar >= 5:
            feedback["grammar"] = "Several grammar errors. Review the corrections above."
        else:
            feedback["grammar"] = "Many grammar errors. Focus on improving this area."
        
        # Clarity feedback
        if clarity >= 8:
            feedback["clarity"] = "Very clear and easy to understand."
        elif clarity >= 6:
            feedback["clarity"] = "Generally clear. Consider varying sentence structure."
        else:
            feedback["clarity"] = "Consider shorter sentences and simpler structure."
        
        # Vocabulary feedback
        if vocabulary >= 8:
            feedback["vocabulary"] = "Great vocabulary variety! Well done."
        elif vocabulary >= 6:
            feedback["vocabulary"] = "Adequate vocabulary. Try using more varied words."
        else:
            feedback["vocabulary"] = "Expand your vocabulary. Use a thesaurus to find alternatives."
        
        # Overall feedback
        error_types = [e.get("type") for e in errors]
        if "grammar" in error_types:
            feedback["focus"] = "Focus on reviewing grammar rules."
        elif "spelling" in error_types:
            feedback["focus"] = "Work on spelling accuracy."
        elif "punctuation" in error_types:
            feedback["focus"] = "Pay attention to punctuation."
        else:
            feedback["focus"] = "Keep practicing! You're making progress."
        
        return feedback
    
    def _identify_strengths(self, grammar: float, clarity: float, vocabulary: float) -> List[str]:
        """Identify user's strengths"""
        strengths = []
        
        if grammar >= 8:
            strengths.append("Strong grammar")
        if clarity >= 8:
            strengths.append("Clear writing")
        if vocabulary >= 8:
            strengths.append("Rich vocabulary")
        if len(strengths) == 0:
            strengths.append("Steady progress")
        
        return strengths
    
    def _identify_weaknesses(self, grammar: float, clarity: float, vocabulary: float) -> List[str]:
        """Identify areas needing improvement"""
        weaknesses = []
        
        if grammar < 7:
            weaknesses.append("Grammar accuracy")
        if clarity < 6:
            weaknesses.append("Clarity and readability")
        if vocabulary < 7:
            weaknesses.append("Vocabulary variety")
        
        return weaknesses if weaknesses else ["Practice consistently"]
    
    def _detect_advanced_words(self, text: str) -> int:
        """Detect presence of advanced vocabulary"""
        advanced_words = {
            "sophisticated", "eloquent", "pragmatic", "meticulous",
            "perspicacious", "obfuscate", "cogent", "ephemeral",
            "ubiquitous", "juxtapose", "ameliorate"
        }
        
        text_lower = text.lower()
        count = 0
        for word in advanced_words:
            if word in text_lower:
                count += 1
        
        return count


# ─── Adaptive Difficulty ────────────────────────────────────────
class AdaptiveDifficultyEngine:
    """Adjusts practice difficulty based on performance"""
    
    def __init__(self, db):
        self.db = db
    
    async def adjust_difficulty(
        self,
        user_id: str,
        recent_scores: List[float],
        current_difficulty: int
    ) -> int:
        """
        Adjusts difficulty level (1-10)
        Returns new difficulty level
        """
        if len(recent_scores) < 3:
            return current_difficulty
        
        avg_score = sum(recent_scores) / len(recent_scores)
        
        # If consistently high, increase difficulty
        if avg_score >= 8.5 and current_difficulty < 10:
            return min(10, current_difficulty + 1)
        
        # If consistently low, decrease difficulty
        elif avg_score < 5.5 and current_difficulty > 1:
            return max(1, current_difficulty - 1)
        
        # Stay same
        return current_difficulty
    
    async def get_recommended_difficulty(self, user_id: str) -> int:
        """Get difficulty recommendation based on learning level"""
        
        user = await self.db.users.find_one({"_id": ObjectId(user_id)})
        level = user.get("current_level", 1) if user else 1
        
        # Map learning level to difficulty
        # Levels 1-5 = Difficulty 1-3 (Easy)
        # Levels 6-15 = Difficulty 4-6 (Medium)
        # Levels 16-25 = Difficulty 7-9 (Hard)
        # Levels 26-30 = Difficulty 9-10 (Expert)
        
        if level <= 5:
            return 3
        elif level <= 15:
            return 6
        elif level <= 25:
            return 8
        else:
            return 10
