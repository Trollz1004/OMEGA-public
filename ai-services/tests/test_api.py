"""
Tests for Dating App AI Services API.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

# Import the FastAPI app
import sys
sys.path.insert(0, '..')
from main import app


@pytest.fixture
def mock_ollama_response():
    """Mock Ollama client responses."""
    async def mock_generate(*args, **kwargs):
        return "This is a generated response for testing purposes."

    async def mock_health():
        return {
            "ollama_running": True,
            "model_configured": "llama3.2:3b",
            "model_available": True,
            "available_models": ["llama3.2:3b"]
        }

    return mock_generate, mock_health


@pytest.mark.asyncio
async def test_health_endpoint():
    """Test health check endpoint."""
    with patch('main.get_ollama_client') as mock_client:
        mock_client.return_value.health_check = AsyncMock(return_value={
            "ollama_running": True,
            "model_configured": "llama3.2:3b",
            "model_available": True
        })

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "model" in data


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test root endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_bio_generate_validation():
    """Test bio generation request validation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Missing required fields should return 422
        response = await client.post("/bio/generate", json={})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_bio_generate_success():
    """Test successful bio generation."""
    with patch('services.get_ollama_client') as mock_client:
        mock_client.return_value.generate = AsyncMock(
            return_value="I'm an adventurous soul who loves hiking and coffee."
        )

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/bio/generate", json={
                "name": "Alex",
                "age": 28,
                "occupation": "Software Engineer",
                "interests": ["hiking", "coffee", "photography"],
                "looking_for": "meaningful connections",
                "tone": "adventurous"
            })

        assert response.status_code == 200
        data = response.json()
        assert "bio" in data
        assert "word_count" in data


@pytest.mark.asyncio
async def test_conversation_starters():
    """Test conversation starters generation."""
    with patch('services.get_ollama_client') as mock_client:
        mock_client.return_value.generate = AsyncMock(
            return_value="1. I noticed you love hiking - what's your favorite trail?\n2. Fellow coffee enthusiast here!"
        )

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/conversation/starters", json={
                "target_profile": {
                    "name": "Jordan",
                    "bio": "Coffee addict and weekend hiker",
                    "interests": ["coffee", "hiking", "books"]
                },
                "my_profile": {
                    "name": "Alex",
                    "interests": ["hiking", "photography"]
                },
                "count": 2,
                "style": "curious"
            })

        assert response.status_code == 200
        data = response.json()
        assert "starters" in data
        assert "common_interests" in data


@pytest.mark.asyncio
async def test_compatibility_analysis():
    """Test compatibility analysis."""
    with patch('services.get_ollama_client') as mock_client:
        mock_client.return_value.generate = AsyncMock(
            return_value="Compatibility: 78/100. Both share a love for outdoor activities..."
        )

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/compatibility/analyze", json={
                "user_a": {
                    "name": "Alex",
                    "age": 28,
                    "interests": ["hiking", "photography"],
                    "looking_for": "relationship"
                },
                "user_b": {
                    "name": "Jordan",
                    "age": 26,
                    "interests": ["hiking", "travel"],
                    "looking_for": "relationship"
                },
                "quick_mode": True
            })

        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "analysis" in data


@pytest.mark.asyncio
async def test_icebreaker_generation():
    """Test icebreaker question generation."""
    with patch('services.get_ollama_client') as mock_client:
        mock_client.return_value.generate = AsyncMock(
            return_value="1. If you could travel anywhere tomorrow, where would it be?\n2. What's your go-to coffee order?"
        )

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/icebreaker/generate", json={
                "their_profile": {
                    "name": "Jordan",
                    "bio": "Adventure seeker",
                    "interests": ["travel", "coffee"]
                },
                "category": "experiences",
                "difficulty": "easy",
                "count": 2
            })

        assert response.status_code == 200
        data = response.json()
        assert "questions" in data


@pytest.mark.asyncio
async def test_profile_review():
    """Test profile review."""
    with patch('services.get_ollama_client') as mock_client:
        mock_client.return_value.generate = AsyncMock(
            return_value="First Impression: 7/10. Your bio is engaging but could use more conversation hooks..."
        )

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/profile/review", json={
                "bio": "I love hiking and trying new restaurants. Looking for someone to explore with!",
                "age": 28,
                "quick_mode": True
            })

        assert response.status_code == 200
        data = response.json()
        assert "review" in data


@pytest.mark.asyncio
async def test_message_suggestion():
    """Test message suggestion."""
    with patch('services.get_ollama_client') as mock_client:
        mock_client.return_value.generate = AsyncMock(
            return_value="1. That sounds amazing! What was the best part of your trip?\n2. I'd love to hear more about it!"
        )

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/conversation/suggest", json={
                "conversation_history": [
                    {"role": "user", "content": "Hey, I saw you like travel!"},
                    {"role": "them", "content": "Yes! Just got back from Japan actually."}
                ],
                "their_interests": ["travel", "photography"],
                "my_interests": ["travel", "food"],
                "goal": "get_to_know",
                "count": 2
            })

        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
