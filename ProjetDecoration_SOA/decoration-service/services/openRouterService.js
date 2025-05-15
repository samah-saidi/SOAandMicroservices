const axios = require('axios');
require('dotenv').config();

class OpenRouterService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.apiUrl = 'https://openrouter.ai/api/v1';

        if (!this.apiKey) {
            throw new Error('OpenRouter API key is missing. Please check your .env file.');
        }

        this.client = axios.create({
            baseURL: this.apiUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:50053', // Required by OpenRouter
                'X-Title': 'Decoration Service' // Optional but recommended
            }
        });
    }

    async analyzeSentiment(text) {
        try {
            if (!text) {
                throw new Error('Text is required for sentiment analysis');
            }

            const response = await this.client.post('/chat/completions', {
                model: 'anthropic/claude-3-opus-20240229',
                messages: [
                    {
                        role: 'system',
                        content: 'Analyse le sentiment du texte suivant et extrait les mots-clés importants. Réponds au format JSON avec un score de sentiment (-1 à 1) et une liste de mots-clés.'
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ]
            });

            try {
                const result = JSON.parse(response.data.choices[0].message.content);
                if (!result.score || !result.keywords) {
                    throw new Error('Invalid response format from OpenRouter');
                }
                return {
                    score: result.score,
                    keywords: result.keywords
                };
            } catch (parseError) {
                console.error('Error parsing OpenRouter response:', parseError);
                return {
                    score: 0,
                    keywords: []
                };
            }
        } catch (error) {
            console.error('Error in sentiment analysis:', error);
            return {
                score: 0,
                keywords: []
            };
        }
    }

    async suggestKeywords(text) {
        try {
            if (!text) {
                throw new Error('Text is required for keyword suggestion');
            }

            const response = await this.client.post('/chat/completions', {
                model: 'anthropic/claude-3-opus-20240229',
                messages: [
                    {
                        role: 'system',
                        content: 'Suggère des mots-clés pertinents pour le texte suivant. Réponds au format JSON avec une liste de mots-clés.'
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ]
            });

            try {
                const result = JSON.parse(response.data.choices[0].message.content);
                if (!result.keywords || !Array.isArray(result.keywords)) {
                    throw new Error('Invalid response format from OpenRouter');
                }
                return result.keywords;
            } catch (parseError) {
                console.error('Error parsing OpenRouter response:', parseError);
                return [];
            }
        } catch (error) {
            console.error('Error in keyword suggestion:', error);
            return [];
        }
    }
}

module.exports = new OpenRouterService(); 