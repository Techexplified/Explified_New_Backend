const axios = require("axios");

exports.chatCompletion = async (req, res) => {
    try {
        const { modelId, messages, userKey, temperature, top_p, max_tokens } = req.body;
        let responseText = "";

        // Default system key from env if userKey is not provided
        // Note: In frontend it was checking import.meta.env.VITE_TRONE_GEMINI_API_KEY
        // We should probably use process.env.GEMINI_API_KEY or similar on backend
        // For now, let's assume the frontend passes the key or we use a backend env var if needed.
        // If userKey is provided, we use it. If not, we might fail or use a default if configured.

        // Helper for fallback
        const runFallback = async (originalPrompt, modelId) => {
            try {
                const sysKey = process.env.VITE_TRONE_GEMINI_API_KEY;
                if (!sysKey) return null;

                const personaPrompt = `You are ${modelId}. Answer the following request as if you are that AI model. Request: ${originalPrompt}`;

                const res = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${sysKey}`,
                    { contents: [{ parts: [{ text: personaPrompt }] }] }
                );
                return res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            } catch (e) {
                console.error("Fallback failed:", e.message);
                return null;
            }
        };

        if (!modelId) {
            return res.status(400).json({ error: "Model ID is required" });
        }

        const lastMessage = messages[messages.length - 1];
        const promptText = lastMessage?.content || lastMessage?.text || "";

        try {
            if (modelId === "openai") {
                if (!userKey) throw new Error("No API Key");
                const response = await axios.post(
                    "https://api.openai.com/v1/chat/completions",
                    {
                        model: "gpt-4o-mini",
                        messages: messages,
                    },
                    { headers: { Authorization: `Bearer ${userKey}` } }
                );
                responseText = response.data?.choices?.[0]?.message?.content;
            }
            else if (modelId === "gemini" || modelId === "explii") {
                // Gemini and Explii use Gemini API
                // If explii, we might want to use a system key if userKey is missing, as per frontend logic
                // But for now, we'll use userKey if passed.
                // Frontend definition: 
                // if (model.id === "explii") use system key.

                let keyToUse = userKey;
                if (modelId === "explii" && !keyToUse) {
                    keyToUse = process.env.VITE_TRONE_GEMINI_API_KEY;
                }

                if (!keyToUse) throw new Error("No API Key");

                // Note: Frontend sends [{role: 'user', content: '...'}] usually. 
                // But Gemini expects { parts: [{ text: '...' }] } structure.
                // We need to adapt 'messages' (which are usually OpenAI format) to Gemini format if needed.
                // Or we accept 'prompt' text and build it.
                // Frontend 'CompareChat.jsx' sends: 
                // OpenAI: messages: [{ role: "user", content: contextPrompt }]
                // Gemini: contents: [{ parts: [{ text: contextPrompt }] }]

                // Let's assume frontend sends a simplified 'prompt' or 'messages' array.
                // The controller should probably take 'messages' and adapt.

                const response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyToUse}`,
                    { contents: [{ parts: [{ text: promptText }] }] }
                );
                responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            }
            else if (["llama", "grok", "perplexity", "qwen"].includes(modelId)) {
                if (!userKey) throw new Error("No API Key");

                let baseUrl = "";
                let modelName = "";

                if (modelId === "llama") {
                    baseUrl = "https://integrate.api.nvidia.com/v1";
                    modelName = "meta/llama-4-maverick-17b-128e-instruct";
                } else if (modelId === "grok") {
                    baseUrl = "https://api.x.ai/v1";
                    modelName = "grok-beta";
                } else if (modelId === "perplexity") {
                    baseUrl = "https://api.perplexity.ai";
                    modelName = "sonar-medium-online";
                } else if (modelId === "qwen") {
                    baseUrl = "https://integrate.api.nvidia.com/v1";
                    modelName = "qwen/qwen2.5-coder-32b-instruct";
                }

                const response = await axios.post(
                    `${baseUrl}/chat/completions`,
                    {
                        model: modelName,
                        messages: messages,
                        temperature: temperature || 0.2,
                        top_p: top_p || 0.7,
                        max_tokens: max_tokens || 1024
                    },
                    { headers: { Authorization: `Bearer ${userKey}` } }
                );
                responseText = response.data?.choices?.[0]?.message?.content;
            }
            else if (modelId === "anthropic") {
                if (!userKey) throw new Error("No API Key");

                const response = await axios.post(
                    "https://api.anthropic.com/v1/messages",
                    {
                        model: "claude-3-haiku-20240307",
                        max_tokens: 1024,
                        messages: [{ role: "user", content: promptText }],
                    },
                    {
                        headers: {
                            "x-api-key": userKey,
                            "anthropic-version": "2023-06-01",
                            "content-type": "application/json"
                        }
                    }
                );
                responseText = response.data?.content?.[0]?.text;
            }
            else {
                return res.status(400).json({ error: "Unsupported model ID" });
            }
        } catch (primaryError) {
            console.warn(`Primary provider ${modelId} failed: ${primaryError.message}. Attempting fallback.`);
            // Fallback logic
            const fallbackText = await runFallback(promptText, modelId);
            if (fallbackText) {
                responseText = fallbackText;
            } else {
                // If fallback also fails, return the original error
                // Check if it's an axios error
                if (primaryError.response) {
                    return res.status(primaryError.response.status).json({
                        success: false,
                        error: primaryError.response.data || primaryError.message
                    });
                }
                return res.status(500).json({ success: false, error: primaryError.message });
            }
        }

        res.status(200).json({ success: true, text: responseText });

    } catch (error) {
        console.error(`Error in chatCompletion for ${req.body.modelId}:`, error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
