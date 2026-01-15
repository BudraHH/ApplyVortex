import logging
import json
import re
import asyncio
from typing import Dict, Any, Optional
import httpx
from agent.config import settings

logger = logging.getLogger("LocalAI")

class LocalAIBaseService:
    """Base class for interacting with Local AI models (Ollama/OpenAI compatible)."""

    def __init__(
        self, 
        model: str = None,
        system_prompt: str = "You are a helpful assistant that always returns valid JSON."
    ):
        self.base_url = settings.AI_BASE_URL
        # Ensure base_url ends with v1 if using chat completions
        if not self.base_url.endswith("/v1"):
             self.url = f"{self.base_url}/chat/completions"
        else:
             self.url = f"{self.base_url}/chat/completions"
             
        # Support direct Ollama generate endpoint if needed, but chat/completions is standard
        # If user sets AI_BASE_URL to http://localhost:11434, we append /v1/chat/completions
        if "v1" not in self.base_url and "api" not in self.base_url:
             self.url = f"{self.base_url}/v1/chat/completions"

        self.model = model or settings.AI_MODEL
        self.system_prompt = system_prompt
        self.timeout = settings.AI_TIMEOUT

    async def generate_json(
        self, 
        prompt: str, 
        temperature: float = 0.1,
        max_tokens: int = 4000,
        response_format: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate JSON response for given prompt using Local AI."""
        
        headers = {
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": self.system_prompt
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }

        # Ollama support for format="json"
        if response_format:
            # If strictly Ollama native
            if settings.AI_PROVIDER == "ollama":
                 payload["format"] = "json"
            else:
                 payload["response_format"] = response_format

        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                    logger.info(f"Local AI Request to {self.url} (Model: {self.model}) - Attempt {attempt+1}")
                    response = await client.post(self.url, headers=headers, json=payload)
                    
                    logger.info(f"Local AI Response received (Status: {response.status_code})")
                    
                    if response.status_code != 200:
                        logger.error(f"AI Error ({response.status_code}): {response.text}")
                        if attempt < max_retries - 1:
                            await asyncio.sleep(2)
                            continue
                        raise Exception(f"AI API Error {response.status_code}")
                    
                    data = response.json()
                    
                    # Handle OpenAI format
                    if "choices" in data:
                        content = data["choices"][0]["message"]["content"]
                    # Handle Raw Ollama format (if using /api/generate)
                    elif "response" in data:
                        content = data["response"]
                    else:
                        content = str(data)

                    return self._parse_json_content(content)

            except Exception as e:
                logger.error(f"AI Attempt {attempt+1} failed: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                else:
                    raise e

    def _parse_json_content(self, content: str) -> Dict[str, Any]:
        """Robustly parse JSON content using json_repair."""
        if not content:
            return {}
            
        content = content.strip()
        
        # 1. Try standard JSON parse first (fastest)
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass
            
        # 2. Try json_repair (magic bullet for LLMs)
        try:
            from json_repair import repair_json
            # returns dictionary directly if return_objects=True
            repaired = repair_json(content, return_objects=True)
            if repaired:
                return repaired
        except ImportError:
            logger.warning("json_repair module not found, falling back to basic sanitization.")
        except Exception as e:
            logger.error(f"json_repair failed: {e}")
            
        # 3. Fallback: Manual sanitization (regex) if json_repair missing or failed
        # Cleaner helper to remove trailing commas and common LLM noise
        def sanitize_json(s: str) -> str:
            # Fix missing output: "key": , -> "key": null,
            s = re.sub(r':\s*(?=[,}\]])', ': null', s)
            # Remove trailing commas in objects/arrays
            s = re.sub(r',\s*([\]\}])', r'\1', s)
            return s

        try:
            match = re.search(r'(\{.*\})', content, re.DOTALL)
            if match:
                json_part = match.group(1)
                return json.loads(sanitize_json(json_part))
        except Exception:
            pass
            
        logger.error(f"Failed to parse JSON. JSONDecodeError. Content Start: {content[:500]}")
        return {}
