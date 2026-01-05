#!/usr/bin/env python3
"""
Setup script for Ollama with GTX 1050Ti optimization.
Downloads and configures the recommended model.
"""

import subprocess
import sys
import httpx
import time


def check_ollama_running():
    """Check if Ollama is running."""
    try:
        response = httpx.get("http://localhost:11434/api/tags", timeout=5)
        return response.status_code == 200
    except Exception:
        return False


def get_installed_models():
    """Get list of installed models."""
    try:
        response = httpx.get("http://localhost:11434/api/tags", timeout=10)
        data = response.json()
        return [m.get("name", "") for m in data.get("models", [])]
    except Exception:
        return []


def pull_model(model_name: str):
    """Pull a model from Ollama."""
    print(f"Pulling model: {model_name}")
    print("This may take a few minutes depending on your connection...")

    try:
        # Use stream to show progress
        with httpx.stream(
            "POST",
            "http://localhost:11434/api/pull",
            json={"name": model_name},
            timeout=600
        ) as response:
            for line in response.iter_lines():
                if line:
                    import json
                    data = json.loads(line)
                    status = data.get("status", "")
                    if "pulling" in status or "downloading" in status:
                        completed = data.get("completed", 0)
                        total = data.get("total", 0)
                        if total > 0:
                            pct = (completed / total) * 100
                            print(f"\r{status}: {pct:.1f}%", end="", flush=True)
                    elif status:
                        print(f"\n{status}")

        print(f"\nModel {model_name} ready!")
        return True

    except Exception as e:
        print(f"\nError pulling model: {e}")
        return False


def main():
    print("=" * 50)
    print("Dating App AI Services - Ollama Setup")
    print("Optimized for GTX 1050Ti (4GB VRAM)")
    print("=" * 50)
    print()

    # Check if Ollama is running
    print("Checking Ollama status...")
    if not check_ollama_running():
        print("\nOllama is not running!")
        print("Please start Ollama first:")
        print("  - Windows: Run 'ollama serve' or start Ollama desktop app")
        print("  - Linux/Mac: Run 'ollama serve'")
        sys.exit(1)

    print("Ollama is running!")
    print()

    # Show installed models
    models = get_installed_models()
    print("Installed models:")
    if models:
        for m in models:
            print(f"  - {m}")
    else:
        print("  (none)")
    print()

    # Recommended models for 1050Ti
    recommended = {
        "1": ("llama3.2:1b", "Fastest, ~1.5GB VRAM, good for quick suggestions"),
        "2": ("llama3.2:3b", "Balanced (RECOMMENDED), ~2.5GB VRAM"),
        "3": ("mistral:7b-instruct-q4_0", "Quality, ~4GB VRAM, slower but better"),
    }

    print("Recommended models for GTX 1050Ti:")
    for key, (name, desc) in recommended.items():
        installed = " [INSTALLED]" if name in models else ""
        print(f"  {key}. {name} - {desc}{installed}")

    print()
    choice = input("Select model to install (1-3) or 'skip' to exit: ").strip()

    if choice.lower() == 'skip':
        print("Skipping model installation.")
        return

    if choice in recommended:
        model_name = recommended[choice][0]
        if model_name in models:
            print(f"\n{model_name} is already installed!")
        else:
            pull_model(model_name)
    else:
        print("Invalid choice.")
        return

    print()
    print("=" * 50)
    print("Setup complete!")
    print()
    print("To start the AI services:")
    print("  pip install -r requirements.txt")
    print("  python main.py")
    print()
    print("Or with Docker:")
    print("  docker-compose up -d")
    print("=" * 50)


if __name__ == "__main__":
    main()
