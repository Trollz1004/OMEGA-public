"""
Configuration settings for the AI Dating Service.
Optimized for GTX 1050Ti (4GB VRAM) with Ollama.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # API Settings
    app_name: str = "Dating App AI Services"
    app_version: str = "1.0.0"
    debug: bool = False

    # Ollama Configuration
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"  # 3B model optimal for 1050Ti
    ollama_timeout: int = 120  # seconds

    # Model Parameters - Optimized for 1050Ti
    # Lower values reduce VRAM usage and increase speed
    default_temperature: float = 0.7
    default_max_tokens: int = 256  # Keep low for faster responses
    default_top_p: float = 0.9
    default_top_k: int = 40

    # Rate Limiting
    rate_limit_per_minute: int = 30
    rate_limit_burst: int = 10

    # Caching
    cache_ttl_seconds: int = 300  # 5 minutes
    cache_max_size: int = 100

    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8001
    workers: int = 1  # Single worker for GPU memory efficiency

    # CORS Origins
    cors_origins: str = "http://localhost:3000,http://localhost:8000"

    class Config:
        env_file = ".env"
        env_prefix = "AI_"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# GPU-Optimized Model Recommendations for 1050Ti (4GB VRAM)
RECOMMENDED_MODELS = {
    "fast": {
        "name": "llama3.2:1b",
        "description": "Fastest, lowest quality. Good for quick suggestions.",
        "vram_usage": "~1.5GB",
        "tokens_per_sec": "~50"
    },
    "balanced": {
        "name": "llama3.2:3b",
        "description": "Best balance of speed and quality for 1050Ti.",
        "vram_usage": "~2.5GB",
        "tokens_per_sec": "~25"
    },
    "quality": {
        "name": "mistral:7b-instruct-q4_0",
        "description": "Higher quality, quantized. Slower but better responses.",
        "vram_usage": "~4GB",
        "tokens_per_sec": "~10"
    }
}
