"""
Project AI Enhancement Service
Handles AI-powered project co-writing features:
- Continue writing
- Improve paragraphs
- Rewrite in different tones
- Version history tracking
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import json
from .llm_service import LLMService


class ProjectAIEnhancer:
    """AI enhancement for project writing"""
    
    def __init__(self, db, llm_service):
        self.db = db
        self.llm_service = llm_service
    
    async def continue_writing(
        self, 
        project_id: str, 
        current_text: str, 
        style: str = "professional",
        length: int = 200
    ) -> Dict[str, Any]:
        """
        Continue writing based on current text
        
        Args:
            project_id: Project ID
            current_text: Current text content
            style: Writing style (professional, casual, academic, creative)
            length: Words to generate (default 200)
        
        Returns:
            {
                'continuation': 'generated text',
                'confidence': 0.95,
                'style_consistency': 0.92
            }
        """
        try:
            prompt = f"""You are a writing assistant helping to continue this text in {style} style.

Current text:
{current_text}

Please continue this text with approximately {length} words, maintaining:
1. The same tone and style ({style})
2. Context and topic continuity
3. Grammar and readability

Provide ONLY the continuation text, no labels or explanations."""
            
            response = await self.llm_service.generate_response(
                prompt=prompt,
                max_tokens=length + 100
            )
            
            continuation = response.get('response', '')
            confidence = response.get('confidence', 0.85)
            
            # Save to version history
            await self._save_version(
                project_id,
                current_text + continuation,
                "AI_CONTINUATION",
                f"Continued in {style} style"
            )
            
            return {
                'continuation': continuation,
                'confidence': confidence,
                'style': style,
                'timestamp': datetime.utcnow()
            }
        
        except Exception as e:
            return {
                'error': str(e),
                'continuation': '',
                'confidence': 0.0
            }
    
    async def improve_paragraph(
        self, 
        paragraph: str,
        focus: str = "clarity"
    ) -> Dict[str, Any]:
        """
        Improve a specific paragraph
        
        Args:
            paragraph: Text to improve
            focus: Focus area (clarity, grammar, vocabulary, flow, tone)
        
        Returns:
            {
                'improved_text': 'enhanced version',
                'improvements': [
                    {'original': 'text', 'improved': 'text', 'reason': 'reason'},
                    ...
                ],
                'score_before': 0.65,
                'score_after': 0.88
            }
        """
        try:
            focus_map = {
                'clarity': 'Make sentences clearer and more direct',
                'grammar': 'Fix grammar and punctuation errors',
                'vocabulary': 'Use more sophisticated and precise vocabulary',
                'flow': 'Improve sentence flow and transitions',
                'tone': 'Improve tone consistency and appropriateness'
            }
            
            focus_instruction = focus_map.get(focus, focus_map['clarity'])
            
            prompt = f"""Improve this paragraph focusing on {focus}:

Original text:
{paragraph}

Instructions:
1. {focus_instruction}
2. Maintain the original meaning and intent
3. Provide the improved version
4. List specific improvements made (max 3)

Format your response as JSON:
{{
    "improved_text": "your improved version",
    "improvements": [
        {{"original": "phrase", "improved": "phrase", "reason": "explanation"}}
    ],
    "overall_change": "brief summary of changes"
}}"""
            
            response = await self.llm_service.generate_response(prompt)
            
            try:
                result = json.loads(response.get('response', '{}'))
                return {
                    'improved_text': result.get('improved_text', paragraph),
                    'improvements': result.get('improvements', []),
                    'focus': focus,
                    'confidence': response.get('confidence', 0.85),
                    'timestamp': datetime.utcnow()
                }
            except json.JSONDecodeError:
                return {
                    'improved_text': response.get('response', paragraph),
                    'improvements': [],
                    'focus': focus,
                    'confidence': 0.7
                }
        
        except Exception as e:
            return {'error': str(e), 'improved_text': paragraph}
    
    async def rewrite_in_tone(
        self, 
        text: str, 
        target_tone: str
    ) -> Dict[str, Any]:
        """
        Rewrite text in different tone
        
        Args:
            text: Original text
            target_tone: Target tone (formal, casual, professional, academic, creative, humorous)
        
        Returns:
            {
                'rewritten_text': 'text in new tone',
                'tone_score': 0.92,
                'confidence': 0.88,
                'tone_characteristics': [...]
            }
        """
        try:
            tone_descriptions = {
                'formal': 'professional, structured, no contractions, third person',
                'casual': 'conversational, friendly, contractions OK, informal language',
                'professional': 'business-appropriate, confident, organized',
                'academic': 'scholarly, formal, citations style, objective',
                'creative': 'imaginative, descriptive, narrative elements',
                'humorous': 'witty, funny, light-hearted, engaging'
            }
            
            tone_desc = tone_descriptions.get(target_tone, target_tone)
            
            prompt = f"""Rewrite this text in a {target_tone} tone.

Original text:
{text}

Target tone characteristics: {tone_desc}

Requirements:
1. Maintain the core message and information
2. Adopt the exact tone specified
3. Adjust vocabulary and sentence structure appropriately
4. Keep length similar to original

Provide ONLY the rewritten text."""
            
            response = await self.llm_service.generate_response(prompt)
            
            return {
                'rewritten_text': response.get('response', text),
                'target_tone': target_tone,
                'confidence': response.get('confidence', 0.85),
                'tone_characteristics': tone_desc.split(', '),
                'timestamp': datetime.utcnow()
            }
        
        except Exception as e:
            return {'error': str(e), 'rewritten_text': text}
    
    async def _save_version(
        self, 
        project_id: str, 
        content: str, 
        change_type: str,
        description: str
    ) -> bool:
        """Save version history for project"""
        try:
            version = {
                'project_id': ObjectId(project_id),
                'content': content,
                'change_type': change_type,
                'description': description,
                'timestamp': datetime.utcnow(),
                'word_count': len(content.split())
            }
            
            result = await self.db.project_versions.insert_one(version)
            return bool(result.inserted_id)
        
        except Exception:
            return False
    
    async def get_version_history(
        self, 
        project_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get version history for a project"""
        try:
            versions = await self.db.project_versions.find({
                'project_id': ObjectId(project_id)
            }).sort('timestamp', -1).limit(limit).to_list(limit)
            
            return [
                {
                    'id': str(v['_id']),
                    'change_type': v.get('change_type'),
                    'description': v.get('description'),
                    'timestamp': v.get('timestamp'),
                    'word_count': v.get('word_count')
                }
                for v in versions
            ]
        
        except Exception as e:
            return []
    
    async def restore_version(
        self, 
        project_id: str, 
        version_id: str
    ) -> Optional[str]:
        """Restore project to previous version"""
        try:
            version = await self.db.project_versions.find_one({
                '_id': ObjectId(version_id),
                'project_id': ObjectId(project_id)
            })
            
            return version.get('content') if version else None
        
        except Exception:
            return None
    
    async def get_suggestions(
        self, 
        project_id: str, 
        current_text: str
    ) -> Dict[str, List[str]]:
        """
        Get AI-powered contextual suggestions for current text
        
        Returns suggestions for:
        - Next sentence ideas
        - Vocabulary improvements
        - Structural improvements
        """
        try:
            prompt = f"""Based on this text, provide specific suggestions for improvement:

Text:
{current_text}

Provide suggestions in JSON format:
{{
    "next_ideas": ["idea 1", "idea 2", "idea 3"],
    "vocabulary": ["word suggestion 1", "word suggestion 2"],
    "structure": ["structural suggestion 1", "structural suggestion 2"]
}}

Be concise and actionable."""
            
            response = await self.llm_service.generate_response(prompt)
            
            try:
                result = json.loads(response.get('response', '{}'))
                return {
                    'next_ideas': result.get('next_ideas', []),
                    'vocabulary': result.get('vocabulary', []),
                    'structure': result.get('structure', []),
                    'confidence': response.get('confidence', 0.85)
                }
            except json.JSONDecodeError:
                return {
                    'next_ideas': [],
                    'vocabulary': [],
                    'structure': [],
                    'confidence': 0.0
                }
        
        except Exception as e:
            return {'error': str(e)}
