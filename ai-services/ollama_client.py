"""
Ollama API client for AI text generation.
Optimized for low VRAM GPUs like GTX 1050Ti.
"""

import httpx
import asyncio
import structlog
from typing import Optional, AsyncGenerator
from config import get_settings

logger = structlog.get_logger()


class OllamaClient:
    """Async client for Ollama API."""

    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.ollama_host
        self.model = self.settings.ollama_model
        self.timeout = httpx.Timeout(self.settings.ollama_timeout, connect=10.0)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> str:
        """
        Generate text using Ollama.

        Args:
            prompt: The user prompt
            system_prompt: Optional system context
            temperature: Creativity (0.0-1.0)
            max_tokens: Maximum response length
            stream: Whether to stream response

        Returns:
            Generated text response
        """
        settings = self.settings

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": temperature or settings.default_temperature,
                "num_predict": max_tokens or settings.default_max_tokens,
                "top_p": settings.default_top_p,
                "top_k": settings.default_top_k,
                # GPU optimization options for 1050Ti
                "num_ctx": 2048,  # Reduced context window for memory
                "num_batch": 128,  # Smaller batch size for stability
                "num_gpu": 99,  # Use GPU layers
            }
        }

        if system_prompt:
            payload["system"] = system_prompt

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                return result.get("response", "").strip()

        except httpx.TimeoutException:
            logger.error("Ollama request timed out", model=self.model)
            raise OllamaError("Request timed out. The model may be loading.")
        except httpx.HTTPStatusError as e:
            logger.error("Ollama HTTP error", status=e.response.status_code)
            raise OllamaError(f"HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.error("Ollama error", error=str(e))
            raise OllamaError(f"Failed to generate: {str(e)}")

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream text generation from Ollama.
        Useful for real-time chat responses.
        """
        settings = self.settings

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": temperature or settings.default_temperature,
                "num_predict": max_tokens or settings.default_max_tokens,
                "top_p": settings.default_top_p,
                "top_k": settings.default_top_k,
                "num_ctx": 2048,
                "num_batch": 128,
                "num_gpu": 99,
            }
        }

        if system_prompt:
            payload["system"] = system_prompt

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/generate",
                    json=payload
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            import json
                            data = json.loads(line)
                            if "response" in data:
                                yield data["response"]
                            if data.get("done", False):
                                break

        except Exception as e:
            logger.error("Ollama stream error", error=str(e))
            raise OllamaError(f"Stream failed: {str(e)}")

    async def chat(
        self,
        messages: list[dict],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Chat completion with message history.

        Args:
            messages: List of {"role": "user"|"assistant", "content": "..."}
            temperature: Creativity level
            max_tokens: Max response length

        Returns:
            Assistant response
        """
        settings = self.settings

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature or settings.default_temperature,
                "num_predict": max_tokens or settings.default_max_tokens,
                "top_p": settings.default_top_p,
                "top_k": settings.default_top_k,
                "num_ctx": 2048,
                "num_batch": 128,
                "num_gpu": 99,
            }
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                return result.get("message", {}).get("content", "").strip()

        except Exception as e:
            logger.error("Ollama chat error", error=str(e))
            raise OllamaError(f"Chat failed: {str(e)}")

    async def health_check(self) -> dict:
        """Check if Ollama is running and model is available."""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                # Check Ollama is running
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                models = response.json().get("models", [])

                model_names = [m.get("name", "") for m in models]
                model_available = any(self.model in name for name in model_names)

                return {
                    "ollama_running": True,
                    "model_configured": self.model,
                    "model_available": model_available,
                    "available_models": model_names[:5]  # First 5
                }

        except Exception as e:
            return {
                "ollama_running": False,
                "error": str(e)
            }


class OllamaError(Exception):
    """Custom exception for Ollama errors."""
    pass


# Singleton client instance
_client: Optional[OllamaClient] = None


def get_ollama_client() -> OllamaClient:
    """Get or create Ollama client instance."""
    global _client
    if _client is None:
        _client = OllamaClient()
    return _client
