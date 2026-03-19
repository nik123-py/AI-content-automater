"""
Ollama AI Integration
---------------------
Handles all communication with the local Ollama AI server.
Provides prompt templates for different content types.
"""

import httpx
from typing import Optional
from .config import settings


# ============================================================================
# PROMPT TEMPLATES
# ============================================================================

PROMPT_TEMPLATES = {
    "linkedin": """Transform the following content into a professional LinkedIn post.
Keep it engaging, use appropriate formatting with line breaks, and include a call-to-action.
Target language: {language}

Original content:
{content}

Generate ONLY the LinkedIn post, no explanations:""",

    "twitter": """Convert the following content into a Twitter/X thread (max 5 tweets).
Each tweet should be under 280 characters. Use engaging hooks and hashtags.
Target language: {language}

Original content:
{content}

Generate ONLY the Twitter thread with numbered tweets:""",

    "instagram": """Create an Instagram caption from the following content.
Make it engaging with emojis, include relevant hashtags at the end.
Target language: {language}

Original content:
{content}

Generate ONLY the Instagram caption:""",

    "email": """Transform the following content into a professional email newsletter.
Include a compelling subject line, greeting, body with key points, and sign-off.
Target language: {language}

Original content:
{content}

Generate the email newsletter with Subject line clearly marked:""",

    "youtube_script": """Convert the following content into a YouTube video script.
Include: Hook (first 10 seconds), Introduction, Main points with timestamps, Call-to-action, Outro.
Target language: {language}

Original content:
{content}

Generate ONLY the YouTube script with clear sections:""",

    "youtube_shorts": """Create a YouTube Shorts script (under 60 seconds) from the following content.
Make it punchy, attention-grabbing, with a strong hook in the first 3 seconds.
Target language: {language}

Original content:
{content}

Generate ONLY the Shorts script:"""
}


# ============================================================================
# OLLAMA CLIENT
# ============================================================================

class OllamaClient:
    """
    Client for interacting with the Ollama AI API.
    Handles prompt generation and response parsing.
    """
    
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT
    
    async def generate(
        self, 
        prompt: str, 
        stream: bool = False
    ) -> Optional[str]:
        """
        Send a prompt to Ollama and get the generated response.
        
        Args:
            prompt: The prompt text to send
            stream: Whether to stream the response (not implemented)
            
        Returns:
            Generated text or None if error
        """
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": stream
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                
                data = response.json()
                return data.get("response", "")
                
        except httpx.TimeoutException:
            print(f"[OLLAMA] Timeout after {self.timeout}s")
            return None
        except httpx.HTTPError as e:
            print(f"[OLLAMA] HTTP Error: {e}")
            return None
        except Exception as e:
            print(f"[OLLAMA] Unexpected error: {e}")
            return None
    
    async def repurpose_content(
        self,
        content: str,
        platform: str,
        language: str = "English"
    ) -> Optional[str]:
        """
        Repurpose content for a specific platform.
        
        Args:
            content: Original content to repurpose
            platform: Target platform (linkedin, twitter, etc.)
            language: Target language for output
            
        Returns:
            Repurposed content or None if error
        """
        template = PROMPT_TEMPLATES.get(platform.lower())
        
        if not template:
            print(f"[OLLAMA] Unknown platform: {platform}")
            return None
        
        prompt = template.format(content=content, language=language)
        
        return await self.generate(prompt)
    
    async def check_health(self) -> bool:
        """
        Check if Ollama server is running and accessible.
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False


# Singleton instance
ollama_client = OllamaClient()
