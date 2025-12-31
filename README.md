# AI SLO Guardrail API

A Node.js + TypeScript backend service calling Google’s Gemini models using the Google Gen AI SDK. Includes an LLM-as-judge evaluation step and Datadog-friendly structured logging.

### Models and Vertex AI

The backend uses the **Google Gen AI SDK** (`@google/generative-ai`), which supports both:

- The Gemini Developer API
- The Gemini API on **Vertex AI**

According to the official docs, the same code can run on Vertex AI with minimal changes to authentication and configuration (ADC instead of API key, Vertex project/region) while keeping the same model names (e.g. `gemini-2.5-flash`).

For the hackathon demo, the service runs in **API key mode**. In a production deployment, you would switch to **Vertex AI** by:

- Enabling Vertex AI in the same GCP project,
- Using application default credentials (service account) instead of an API key,
- Configuring the SDK to target the Vertex AI Gemini endpoint.
