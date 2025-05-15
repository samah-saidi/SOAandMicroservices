const openRouterService = require('./services/openRouterService');

async function testOpenRouter() {
    try {
        // Test sentiment analysis
        console.log('Testing sentiment analysis...');
        const sentimentResult = await openRouterService.analyzeSentiment(
            'Cette lampe design scandinave est absolument magnifique. Son style épuré et ses matériaux de qualité en font un excellent choix pour votre salon.'
        );
        console.log('Sentiment Analysis Result:', sentimentResult);

        // Test keyword suggestion
        console.log('\nTesting keyword suggestion...');
        const keywordsResult = await openRouterService.suggestKeywords(
            'Cette lampe design scandinave est absolument magnifique. Son style épuré et ses matériaux de qualité en font un excellent choix pour votre salon.'
        );
        console.log('Keywords Suggestion Result:', keywordsResult);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testOpenRouter(); 