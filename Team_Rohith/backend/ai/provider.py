from abc import ABC, abstractmethod
from openai import OpenAI

class AIProvider(ABC):
    @abstractmethod
    def generate_completion(self, prompt: str) -> str:
        pass

    @abstractmethod
    def generate_embedding(self, text: str) -> list[float]:
        pass

class NemotronProvider(AIProvider):
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("NVIDIA API Key is required for NemotronProvider")
        self.api_key = api_key
        self.base_url = "https://integrate.api.nvidia.com/v1"
        self.model = "nvidia/llama-3.1-nemotron-nano-vl-8b-v1"
        self.client = OpenAI(base_url=self.base_url, api_key=self.api_key)

    def generate_completion(self, prompt: str) -> str:
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                top_p=1,
                max_tokens=1024,
                stream=False,
            )
            return resp.choices[0].message.content
        except Exception as e:
            print(f"Nemotron completion error: {e}")
            return "{}"
            
    def generate_embedding(self, text: str) -> list[float]:
        # Placeholder as Nemotron NV-Embed might require a different endpoint/model
        return [0.0] * 1024 

class OpenAIProvider(AIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Initialize OpenAI client here

    def generate_completion(self, prompt: str) -> str:
        return f"OpenAI Response to: {prompt}"
        
    def generate_embedding(self, text: str) -> list[float]:
        return [0.0] * 1536

def get_ai_provider(provider_name: str, api_keys: dict) -> AIProvider:
    if provider_name == "nemotron":
        return NemotronProvider(api_keys.get("nemotron"))
    elif provider_name == "openai":
        return OpenAIProvider(api_keys.get("openai"))
    else:
        raise ValueError(f"Unknown AI provider: {provider_name}")
