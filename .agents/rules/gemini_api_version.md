# Gemini API Version Rule
**CRITICAL RULE:**
You MUST ALWAYS use the model version `gemini-3.6-flash` whenever querying the Google Generative AI API (Gemini).
This rule overrides any default assumptions about available models. Do NOT use 1.5, 2.0, or 2.5. The ONLY correct version is `gemini-3.6-flash`.

Failure to follow this rule will break the application and anger the user.
