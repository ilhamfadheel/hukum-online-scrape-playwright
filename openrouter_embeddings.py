from langchain_core.embeddings import Embeddings
import requests
from typing import List

class OpenRouterEmbeddings(Embeddings):
    def __init__(self, model="text-embedding-3-small", api_key=None):
        self.model = model
        self.api_key = api_key

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed_text(text) for text in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed_text(text)

    def _embed_text(self, text: str) -> List[float]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "http://localhost",  # Required by OpenRouter
            "Content-Type": "application/json"
        }

        json_data = {
            "model": self.model,
            "input": text
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/embeddings",
            headers=headers,
            json=json_data
        )

        if response.status_code != 200:
            raise Exception(f"OpenRouter error: {response.text}")

        return response.json()["data"][0]["embedding"]
