/**
 * tokenizerSamples.ts
 * 
 * Sample texts for tokenizer testing
 * 
 * Constants:
 *   SAMPLE_TEXTS - Collection of sample texts for different use cases
 * 
 * Usage: import { SAMPLE_TEXTS } from '../constants/tokenizerSamples'
 */

/**
 * Sample texts for different use cases
 */
export const SAMPLE_TEXTS = {
  short: "Hello, how are you doing today?",
  medium: "Explain the concept of quantum computing in simple terms. How does it differ from classical computing, and what are its potential applications?",
  long: `Artificial Intelligence has revolutionized many industries over the past decade. From machine learning algorithms that power recommendation systems to natural language processing models that enable sophisticated chatbots, AI continues to reshape how we interact with technology. 

The development of large language models like GPT, Claude, and others has particularly accelerated progress in natural language understanding and generation. These models are trained on vast amounts of text data and can perform a wide variety of tasks including writing, analysis, coding, and creative work.

However, with great power comes great responsibility. As AI systems become more capable, we must carefully consider their ethical implications, potential biases, and societal impact. The future of AI development will likely focus on creating more responsible, transparent, and beneficial systems.`,
  code: `function tokenizeText(text: string, model: string): Promise<TokenizationResult> {
  const modelInfo = getModelInfo(model);
  
  switch (modelInfo.provider) {
    case 'openai':
      return tokenizeOpenAI(text, model);
    case 'anthropic':
      return tokenizeAnthropic(text, model);
    case 'deepseek':
      return tokenizeDeepSeek(text, model);
    case 'google':
      return tokenizeGoogle(text, model);
    default:
      throw new Error(\`Unsupported provider: \${modelInfo.provider}\`);
  }
}`
}; 