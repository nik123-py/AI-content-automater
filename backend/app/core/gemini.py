"""
Gemini AI Integration with Google Search Grounding
---------------------------------------------------
Uses Google's Gemini API with live web search capabilities
to fetch real-time trending content across all platforms.
"""

from google import genai
from google.genai import types
from typing import Optional
import json
from .config import settings


# ============================================================================
# TRENDING CONTENT PROMPTS
# ============================================================================

TRENDING_PROMPTS = {
    "linkedin": """
    Browse the web and find the top 5 trending topics on LinkedIn right now.
    
    For each trend, provide:
    1. Topic/Theme
    2. Why it's trending (with source if available)
    3. Content angle suggestion for maximum engagement
    4. Recommended hashtags
    5. Best posting time
    
    Format your response as a JSON array with keys: topic, reason, content_idea, hashtags, best_time
    """,

    "twitter": """
    Browse the web and find the top 5 trending topics and hashtags on Twitter/X right now.
    
    For each trend, provide:
    1. Topic/Theme or Hashtag
    2. Why it's trending (with context)
    3. Tweet thread idea for engagement
    4. Related hashtags to use
    5. Engagement tips
    
    Format your response as a JSON array with keys: topic, reason, content_idea, hashtags, engagement_tip
    """,

    "instagram": """
    Browse the web and find the top 5 trending content ideas and hashtags on Instagram right now.
    
    For each trend, provide:
    1. Topic/Theme
    2. Why it's trending
    3. Best content format (Reel/Post/Story/Carousel)
    4. Caption idea
    5. Trending hashtags to use
    
    Format your response as a JSON array with keys: topic, reason, format, caption_idea, hashtags
    """,

    "youtube": """
    Browse the web and find the top 5 trending video topics on YouTube right now.
    Check YouTube trending page and popular niches.
    
    For each trend, provide:
    1. Topic/Theme
    2. Why it's trending
    3. Viral video title suggestion
    4. Content outline/hook
    5. Tags to use
    
    Format your response as a JSON array with keys: topic, reason, title_idea, outline, tags
    """,

    "general": """
    Browse the web and find the top 5 trending topics across ALL major social media platforms today:
    - Twitter/X (check trending hashtags)
    - Reddit (check r/popular, r/all)
    - YouTube (trending videos)
    - Instagram (trending reels/hashtags)
    - LinkedIn (professional news)
    - TikTok (viral trends)
    
    For each trend, provide:
    1. Topic/Theme
    2. Which platforms it's trending on
    3. Why it's popular right now
    4. Blog/content angle to capitalize on it
    5. Keywords to target for SEO
    
    Format your response as a JSON array with keys: topic, platforms, reason, blog_angle, keywords
    """
}


# ============================================================================
# GEMINI CLIENT WITH GOOGLE SEARCH GROUNDING
# ============================================================================

class GeminiClient:
    """
    Client for Google's Gemini API with Search Grounding.
    Fetches real-time trending data by searching the live web.
    """
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.client = None
        self._initialize()
    
    def _initialize(self):
        """Initialize the Gemini client."""
        if not self.api_key:
            print("[GEMINI] API key not configured")
            return
        
        try:
            # Initialize the new genai client
            self.client = genai.Client(api_key=self.api_key)
            print(f"[GEMINI] Initialized with model: {self.model_name}")
        except Exception as e:
            print(f"[GEMINI] Failed to initialize: {e}")
            self.client = None
    
    async def generate(self, prompt: str, use_search: bool = True) -> Optional[str]:
        """
        Send a prompt to Gemini with optional Google Search grounding.
        
        Args:
            prompt: The prompt text to send
            use_search: Whether to enable Google Search grounding
            
        Returns:
            Generated text or None if error
        """
        if not self.client:
            print("[GEMINI] Client not initialized")
            return None
        
        try:
            # Configure tools for search grounding
            config = None
            if use_search:
                config = types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())]
                )
            
            # Generate content
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            
            if response and response.text:
                print(f"[GEMINI] Generated {len(response.text)} chars")
                return response.text
            
            print("[GEMINI] Empty response received")
            return None
            
        except Exception as e:
            print(f"[GEMINI] Generation error: {type(e).__name__}: {e}")
            return None
    
    async def get_trending_content(
        self,
        platform: str = "general"
    ) -> Optional[str]:
        """
        Get real-time trending content using Google Search grounding.
        
        Args:
            platform: Target platform (linkedin, twitter, instagram, youtube, general)
            
        Returns:
            JSON string with trending topics or None if error
        """
        prompt = TRENDING_PROMPTS.get(platform.lower(), TRENDING_PROMPTS["general"])
        
        # Add current date context
        from datetime import datetime
        current_date = datetime.now().strftime("%B %d, %Y")
        
        full_prompt = f"""Current date: {current_date}

IMPORTANT: Use Google Search to find REAL, CURRENT trending topics from today.
Do NOT make up or guess trends - search the actual web for live data.

{prompt}

Remember to output ONLY valid JSON array format.
"""
        
        print(f"[GEMINI] Fetching live trends for: {platform}")
        return await self.generate(full_prompt, use_search=True)
    
    async def generate_viral_content(
        self,
        topic: str,
        platform: str,
        style: str = "engaging"
    ) -> Optional[str]:
        """
        Generate viral-optimized content for a topic.
        Uses search grounding to understand current context.
        
        Args:
            topic: The topic to write about
            platform: Target platform
            style: Writing style (engaging, professional, casual, humorous)
            
        Returns:
            Generated content or None if error
        """
        prompt = f"""First, search the web to understand the current context and sentiment around: "{topic}"

Then create viral-optimized {platform} content about this topic.

Style: {style}
Goal: Maximum engagement, shares, and virality

Requirements:
- Strong hook in the first line that stops the scroll
- Emotional triggers that resonate
- Clear call-to-action
- Platform-specific formatting for {platform}
- Relevant trending hashtags (search for current ones)
- Reference any current events or news related to the topic

Generate the complete, ready-to-post content now:"""
        
        return await self.generate(prompt, use_search=True)
    
    async def check_health(self) -> bool:
        """
        Check if Gemini API is accessible.
        
        Returns:
            True if healthy, False otherwise
        """
        if not self.client:
            return False
        
        try:
            # Simple test without search
            response = self.client.models.generate_content(
                model=self.model_name,
                contents="Say OK"
            )
            return response is not None and len(response.text) > 0
        except Exception as e:
            print(f"[GEMINI] Health check failed: {e}")
            return False


# Singleton instance
gemini_client = GeminiClient()
