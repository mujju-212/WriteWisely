"""
advanced_prompts.py — Enhanced Prompt Engineering Layer
Provides reusable, dynamic prompt templates with variable injection
Returns structured outputs (JSON-like) for consistent AI responses
"""

from typing import Dict, List, Any

# ─── Prompt Templates Registry ──────────────────────────────────
class AdvancedPromptEngine:
    """Manages dynamic prompt generation with context injection"""
    
    @staticmethod
    def grammar_correction_prompt(
        text: str,
        weak_areas: List[str] = None,
        user_level: str = "Intermediate"
    ) -> str:
        """
        Generates grammar correction prompt with explanations
        Returns structured feedback: error, explanation, correction, why_matters
        """
        focus = ""
        if weak_areas:
            focus = f"\n⚠️ Focus on these problem areas for this user: {', '.join(weak_areas)}"
        
        return f"""
You are an expert grammar coach. Analyze this text and provide corrections with EXPLANATIONS.

TEXT TO ANALYZE:
"{text}"

USER LEVEL: {user_level}
{focus}

📋 RESPONSE FORMAT (JSON-like):
{{
  "corrections": [
    {{
      "original": "exact phrase with error",
      "corrected": "fixed phrase",
      "error_type": "grammar/spelling/punctuation/style",
      "explanation": "why this is wrong",
      "teaching_point": "how to fix it",
      "importance": "critical/high/medium/low",
      "example": "how to use correctly"
    }}
  ],
  "overall_score": 1-10,
  "summary": "brief overall feedback",
  "key_strengths": ["what they did well"],
  "areas_to_improve": ["top 3 areas"]
}}

REMEMBER:
- Be encouraging but honest
- Explain WHY the correction matters
- Tailor complexity to {user_level} level
- Prioritize user's weak areas
"""
    
    @staticmethod
    def writing_evaluation_prompt(
        text: str,
        evaluation_type: str = "general",
        rubric: Dict[str, float] = None
    ) -> str:
        """
        Generates comprehensive writing evaluation prompt
        evaluation_type: general, academic, professional, creative, email
        rubric: custom scoring weights
        """
        rubric_str = ""
        if rubric:
            rubric_str = "\nCRITERIA WEIGHTS:\n" + "\n".join(
                [f"- {k}: {v*100}%" for k, v in rubric.items()]
            )
        
        return f"""
You are an experienced writing evaluator. Evaluate this {evaluation_type} writing sample holistically.

TEXT TO EVALUATE:
"{text}"
{rubric_str}

📊 EVALUATION RESPONSE (JSON format):
{{
  "scores": {{
    "grammar": 1-10,
    "clarity": 1-10,
    "vocabulary": 1-10,
    "structure": 1-10,
    "readability": 1-10,
    "engagement": 1-10
  }},
  "overall_score": 1-100,
  "strengths": ["top 3 strengths"],
  "weaknesses": ["top 3 areas to improve"],
  "specific_feedback": ["3-4 actionable suggestions"],
  "rewrite_suggestions": [
    {{
      "phrase": "original phrase",
      "suggested": "improved version",
      "reason": "why this is better"
    }}
  ],
  "recommended_focus": ["topic for user to study"],
  "confidence": 0.0-1.0
}}

Be specific and provide examples. Focus on {evaluation_type} conventions.
"""
    
    @staticmethod
    def ai_coach_prompt(
        user_context: str,
        user_question: str,
        conversation_history: List[Dict] = None
    ) -> str:
        """
        Generates AI coach/mentor prompt
        Maintains personalization and learning history
        """
        history_str = ""
        if conversation_history:
            history_str = "\n📝 PREVIOUS CONVERSATION:\n"
            for msg in conversation_history[-3:]:  # Last 3 messages
                history_str += f"- User: {msg.get('question', '')[:100]}\n"
                history_str += f"  Coach: {msg.get('answer', '')[:100]}...\n"
        
        return f"""
You are WriteWisely's personalized AI writing coach. Your role is to:
1. Provide encouraging, patient guidance
2. Adapt explanations to the user's level
3. Connect feedback to their learning history
4. Generate practice exercises when needed
5. Celebrate progress

{user_context}

USER'S QUESTION/REQUEST:
"{user_question}"
{history_str}

📝 COACHING RESPONSE SHOULD:
- Start with empathy/encouragement
- Address their specific question
- Reference their weak areas when relevant
- Provide 1-2 actionable examples
- End with motivational message
- Include suggested practice if appropriate

Tone: Supportive, clear, practical, never condescending.
Keep responses concise (3-4 paragraphs max).
"""
    
    @staticmethod
    def lesson_generation_prompt(
        topic: str,
        user_level: str,
        weak_area_focus: str = None
    ) -> str:
        """
        Generates AI-created micro-lessons
        Used for personalized learning recommendations
        """
        focus_str = f"\nPRIARITY: This user struggles with {weak_area_focus}. Make this lesson especially clear on this point." if weak_area_focus else ""
        
        return f"""
Create a concise, engaging micro-lesson on: {topic}

TARGET AUDIENCE: {user_level} English learner{focus_str}

📖 LESSON STRUCTURE (Markdown format):
## [Topic Title]

### What You'll Learn
- 2-3 bullet points of learning objectives

### The Concept (Keep it simple!)
- Clear explanation with everyday analogy
- 1-2 sentences max

### 📌 Key Rules
- 3-4 simple rules in plain language
- Use "do" and "don't" format

### ✅ Examples
**CORRECT:**
- Example 1 with explanation
- Example 2 with explanation

**INCORRECT:**
- Wrong example with why it's wrong
- Wrong example with correction

### 🎯 Practice Tip
- One actionable tip for practice

### Common Mistakes
- What learners often do wrong
- How to avoid it

Keep technical jargon minimal. Use examples from {user_level} student's daily life.
"""
    
    @staticmethod
    def project_cowriter_prompt(
        project_text: str,
        user_request: str,
        tone: str = "professional",
        style: str = "concise"
    ) -> str:
        """
        Generates AI co-writing suggestions for projects
        request: "continue", "improve_paragraph", "rewrite_tone", etc.
        """
        
        return f"""
You are a professional writing assistant helping refine a document.

DOCUMENT CONTENT:
"{project_text}"

USER REQUEST: {user_request}

📝 CO-WRITING PARAMETERS:
- Tone: {tone}
- Style: {style}
- Keep user's voice and original ideas
- No hallucinated content

RESPONSE FORMAT:
{{
  "action": "{user_request}",
  "suggestion": "improved text or continuation",
  "explanation": "why this change helps",
  "alternatives": ["alternative 1", "alternative 2"],
  "matches_tone": true/false,
  "improvement_areas": ["what this fixes"]
}}

Maintain consistency with the existing text. Don't change user's intended meaning.
"""
    
    @staticmethod
    def dynamic_practice_prompt(
        user_level: str,
        weak_areas: List[str],
        recent_mistakes: List[Dict]
    ) -> str:
        """
        Generates practice exercises focused on user's weak areas
        """
        weak_str = ", ".join(weak_areas[:3])
        mistakes_str = ", ".join([m.get("type", "") for m in recent_mistakes[:3]])
        
        return f"""
Create a focused writing practice exercise.

TARGET USER:
- Level: {user_level}
- Weak Areas: {weak_str}
- Recent Mistakes: {mistakes_str}

📝 PRACTICE EXERCISE FORMAT:
{{
  "task": "Write a [specific task type]",
  "topic": "About [specific topic]",
  "constraints": [
    "Must include dialogue",
    "Keep under 150 words",
    "Focus on {weak_areas[0] if weak_areas else 'grammar'}"
  ],
  "example_good": "Sample of what good looks like",
  "example_bad": "Sample of common mistakes",
  "focus_area": "What this practice targets",
  "difficulty": 1-10,
  "estimated_time": "5-10 minutes"
}}

Design for: Quick, engaging, immediately applicable to user's needs.
"""
    
    @staticmethod
    def analytics_insight_prompt(
        user_metrics: Dict[str, Any],
        time_period: str = "7days"
    ) -> str:
        """
        Generates AI-powered analytics insights
        time_period: 7days, 30days, alltime
        """
        
        return f"""
Analyze this user's writing performance and generate insights.

USER METRICS ({time_period}):
{str(user_metrics)}

📊 INSIGHT RESPONSE FORMAT:
{{
  "headline": "Most important finding (1 sentence)",
  "key_metrics": {{
    "improvement": "improvement percentage",
    "consistency": "how regularly user practiced",
    "focus_area_progress": "progress in weak areas"
  }},
  "insights": [
    "insight 1: specific pattern noticed",
    "insight 2: comparison to previous period",
    "insight 3: actionable observation"
  ],
  "recommendations": [
    "recommended focus area",
    "next lesson suggestion",
    "practice type to try"
  ],
  "celebration": "What user is doing well"
}}

Be data-driven and encouraging. Provide actionable next steps.
"""


# ─── Prompt Selector ────────────────────────────────────────────
class PromptSelector:
    """Selects and injects appropriate prompt based on context"""
    
    @staticmethod
    def select_prompt(
        request_type: str,
        **kwargs
    ) -> str:
        """
        Dynamically selects appropriate prompt
        request_type: grammar, evaluation, coaching, lesson, cowrite, practice, analytics
        """
        prompts = {
            "grammar": AdvancedPromptEngine.grammar_correction_prompt,
            "evaluation": AdvancedPromptEngine.writing_evaluation_prompt,
            "coaching": AdvancedPromptEngine.ai_coach_prompt,
            "lesson": AdvancedPromptEngine.lesson_generation_prompt,
            "cowrite": AdvancedPromptEngine.project_cowriter_prompt,
            "practice": AdvancedPromptEngine.dynamic_practice_prompt,
            "analytics": AdvancedPromptEngine.analytics_insight_prompt,
        }
        
        prompt_fn = prompts.get(request_type)
        if not prompt_fn:
            return "Unknown request type"
        
        return prompt_fn(**kwargs)
