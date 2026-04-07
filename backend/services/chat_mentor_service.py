"""
Chat Mentor Service
Intelligent chat system with:
- User mistake explanations
- Practice exercise generation
- Learning progress summarization
- Grammar/writing Q&A
- Conversation memory
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import json
from .llm_service import LLMService
from .ai_context_engine import UserContextEngine
from .explanation_engine import ExplanationEngine


class ChatMentorService:
    """Intelligent chat mentor with context awareness"""
    
    def __init__(
        self, 
        db: AsyncIOMotorDatabase, 
        llm_service: LLMService,
        context_engine: UserContextEngine,
        explanation_engine: ExplanationEngine
    ):
        self.db = db
        self.llm_service = llm_service
        self.context_engine = context_engine
        self.explanation_engine = explanation_engine
    
    async def get_chat_response(
        self, 
        user_id: str, 
        message: str,
        conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get intelligent chat response with context
        
        Analyzes message type and responds appropriately:
        - Mistake explanation
        - Practice exercise generation
        - Progress summary
        - Writing advice
        - General Q&A
        """
        try:
            # Get user context
            user_context = await self.context_engine.build_chat_context(user_id)
            
            # Get recent conversation
            recent_messages = await self._get_conversation_history(
                user_id, 
                conversation_id,
                limit=5
            )
            
            # Classify message type
            message_type = await self._classify_message(message, user_context)
            
            # Route to appropriate handler
            if message_type == 'mistake_explanation':
                response = await self._explain_user_mistakes(user_id, message, user_context)
            elif message_type == 'practice_request':
                response = await self._generate_practice_exercise(user_id, message, user_context)
            elif message_type == 'progress_query':
                response = await self._summarize_progress(user_id, user_context)
            elif message_type == 'writing_advice':
                response = await self._provide_writing_advice(message, user_context)
            else:
                response = await self._answer_general_query(message, user_context, recent_messages)
            
            # Save to chat history
            await self._save_chat_message(
                user_id,
                'user',
                message,
                conversation_id,
                message_type
            )
            
            await self._save_chat_message(
                user_id,
                'mentor',
                response.get('response', ''),
                conversation_id,
                message_type
            )
            
            return {
                'response': response.get('response', ''),
                'confidence': response.get('confidence', 0.85),
                'message_type': message_type,
                'suggestions': response.get('suggestions', []),
                'timestamp': datetime.utcnow()
            }
        
        except Exception as e:
            return {
                'response': f'I encountered an error. Please try again. ({str(e)})',
                'confidence': 0.0,
                'error': True
            }
    
    async def _classify_message(
        self, 
        message: str, 
        user_context: str
    ) -> str:
        """Classify message type to route to appropriate handler"""
        try:
            prompt = f"""Classify this user message into one category:

Message: {message}

Categories:
1. 'mistake_explanation' - User asking to explain a writing mistake
2. 'practice_request' - User asking for practice exercises
3. 'progress_query' - User asking about their learning progress
4. 'writing_advice' - User asking for writing tips/advice
5. 'general_query' - Other questions

Respond with ONLY the category name."""
            
            response = await self.llm_service.generate_response(prompt)
            category = response.get('response', 'general_query').strip().lower()
            
            valid_categories = [
                'mistake_explanation',
                'practice_request',
                'progress_query',
                'writing_advice',
                'general_query'
            ]
            
            return category if category in valid_categories else 'general_query'
        
        except:
            return 'general_query'
    
    async def _explain_user_mistakes(
        self, 
        user_id: str, 
        message: str,
        user_context: str
    ) -> Dict[str, Any]:
        """Explain user's writing mistakes"""
        try:
            prompt = f"""You are an expert writing mentor. 

User Context:
{user_context}

User's message/mistake:
{message}

Provide a comprehensive explanation that includes:
1. What is wrong with their writing
2. Why it's a common mistake
3. How to fix it with specific examples
4. Practice tip to avoid this mistake

Keep explanation clear and encouraging."""
            
            response = await self.llm_service.generate_response(prompt)
            
            return {
                'response': response.get('response', ''),
                'confidence': response.get('confidence', 0.9),
                'suggestions': ['Practice similar sentences', 'Review grammar rules']
            }
        
        except Exception as e:
            return {'response': f'Error explaining mistake: {str(e)}', 'confidence': 0.0}
    
    async def _generate_practice_exercise(
        self, 
        user_id: str, 
        message: str,
        user_context: str
    ) -> Dict[str, Any]:
        """Generate targeted practice exercise"""
        try:
            prompt = f"""Create a personalized practice exercise based on user request.

User Context:
{user_context}

User request: {message}

Generate:
1. A practice exercise tailored to their level
2. Include 2-3 sentences for them to correct
3. Provide a solution key
4. Explain the grammar/writing concept

Format as a practical exercise they can complete immediately."""
            
            response = await self.llm_service.generate_response(prompt)
            
            return {
                'response': response.get('response', ''),
                'confidence': response.get('confidence', 0.85),
                'suggestions': [
                    'Try the exercise now',
                    'Share your attempt for feedback'
                ]
            }
        
        except Exception as e:
            return {'response': f'Error generating exercise: {str(e)}', 'confidence': 0.0}
    
    async def _summarize_progress(
        self, 
        user_id: str,
        user_context: str
    ) -> Dict[str, Any]:
        """Summarize user's learning progress"""
        try:
            # Get detailed progress
            user = await self.db.users.find_one({'_id': ObjectId(user_id)})
            
            prompt = f"""Based on this user context, create an encouraging progress summary:

User Context:
{user_context}

Include:
1. Key achievements so far
2. Areas of improvement
3. Recommended next steps
4. Motivational message

Keep it positive and actionable."""
            
            response = await self.llm_service.generate_response(prompt)
            
            # Track this interaction
            await self._save_interaction(user_id, 'progress_summary')
            
            return {
                'response': response.get('response', ''),
                'confidence': response.get('confidence', 0.85),
                'suggestions': [
                    'Continue with next lesson',
                    'Try practice exercises',
                    'View detailed analytics'
                ]
            }
        
        except Exception as e:
            return {'response': f'Error summarizing progress: {str(e)}', 'confidence': 0.0}
    
    async def _provide_writing_advice(
        self, 
        message: str,
        user_context: str
    ) -> Dict[str, Any]:
        """Provide general writing advice"""
        try:
            prompt = f"""Answer this writing question from an expert mentor perspective.

User Context:
{user_context}

Question: {message}

Provide:
1. Direct answer to their question
2. Practical examples
3. Common mistakes to avoid
4. Pro tips for improvement

Be helpful and specific."""
            
            response = await self.llm_service.generate_response(prompt)
            
            return {
                'response': response.get('response', ''),
                'confidence': response.get('confidence', 0.85),
                'suggestions': [
                    'See more examples',
                    'Practice this concept',
                    'Ask follow-up question'
                ]
            }
        
        except Exception as e:
            return {'response': f'Error providing advice: {str(e)}', 'confidence': 0.0}
    
    async def _answer_general_query(
        self, 
        message: str,
        user_context: str,
        recent_messages: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Answer general question using conversation history"""
        try:
            # Build conversation context
            conversation_context = self._format_conversation(recent_messages)
            
            prompt = f"""You are a helpful writing mentor in an ongoing conversation.

User Context:
{user_context}

Recent conversation:
{conversation_context}

Current user message: {message}

Respond helpfully to their question. Consider the conversation history."""
            
            response = await self.llm_service.generate_response(prompt)
            
            return {
                'response': response.get('response', ''),
                'confidence': response.get('confidence', 0.85),
                'suggestions': [
                    'Ask clarifying question',
                    'Request more context',
                    'Provide additional resources'
                ]
            }
        
        except Exception as e:
            return {'response': f'Error answering query: {str(e)}', 'confidence': 0.0}
    
    async def _save_chat_message(
        self, 
        user_id: str,
        sender: str,
        message: str,
        conversation_id: Optional[str],
        message_type: str
    ) -> bool:
        """Save chat message to database"""
        try:
            if not conversation_id:
                # Create new conversation
                conv_result = await self.db.chat_conversations.insert_one({
                    'user_id': ObjectId(user_id),
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow(),
                    'message_count': 1
                })
                conversation_id = str(conv_result.inserted_id)
            
            chat_msg = {
                'conversation_id': ObjectId(conversation_id),
                'user_id': ObjectId(user_id),
                'sender': sender,
                'message': message,
                'message_type': message_type,
                'timestamp': datetime.utcnow()
            }
            
            await self.db.chat_messages.insert_one(chat_msg)
            
            # Update conversation
            await self.db.chat_conversations.update_one(
                {'_id': ObjectId(conversation_id)},
                {
                    '$inc': {'message_count': 1},
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )
            
            return True
        
        except Exception:
            return False
    
    async def _get_conversation_history(
        self, 
        user_id: str,
        conversation_id: Optional[str],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get recent conversation messages"""
        try:
            if not conversation_id:
                return []
            
            messages = await self.db.chat_messages.find({
                'conversation_id': ObjectId(conversation_id),
                'user_id': ObjectId(user_id)
            }).sort('timestamp', -1).limit(limit).to_list(limit)
            
            return list(reversed(messages))
        
        except Exception:
            return []
    
    def _format_conversation(self, messages: List[Dict[str, Any]]) -> str:
        """Format conversation for LLM context"""
        formatted = []
        for msg in messages:
            sender = msg.get('sender', 'unknown')
            text = msg.get('message', '')
            formatted.append(f"{sender.capitalize()}: {text}")
        
        return "\n".join(formatted) if formatted else "No previous conversation"
    
    async def _save_interaction(
        self, 
        user_id: str, 
        interaction_type: str
    ) -> bool:
        """Track user interactions with mentor"""
        try:
            await self.db.mentor_interactions.insert_one({
                'user_id': ObjectId(user_id),
                'interaction_type': interaction_type,
                'timestamp': datetime.utcnow()
            })
            return True
        
        except Exception:
            return False
    
    async def get_conversation_list(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all conversations for a user"""
        try:
            conversations = await self.db.chat_conversations.find({
                'user_id': ObjectId(user_id)
            }).sort('updated_at', -1).to_list(20)
            
            return [
                {
                    'id': str(c['_id']),
                    'message_count': c.get('message_count', 0),
                    'created_at': c.get('created_at'),
                    'updated_at': c.get('updated_at')
                }
                for c in conversations
            ]
        
        except Exception:
            return []
