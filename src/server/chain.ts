import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain, SequentialChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeClient } from '@pinecone-database/pinecone';

const pinecone = new PineconeClient();
export const initPinecone = async () => {
  await pinecone.init({
    environment: process.env.PINECONE_ENV!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
  return pinecone;
};

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export const generateIdeas = async (exampleTweet: string, username: string) => {
  try {
    // remove quotes and curly braces as not to confuse langchain template parser
    exampleTweet = exampleTweet.replace(/"/g, '');
    exampleTweet = exampleTweet.replace(/{/g, '');
    exampleTweet = exampleTweet.replace(/}/g, '');

    const pinecone = await initPinecone();

    console.log('list indexes', await pinecone.listIndexes());

    // find the index we created earlier
    const pineconeIndex = pinecone.Index('embeds-test');

    const vectorStore = new PineconeStore(embeddings, {
      pineconeIndex: pineconeIndex,
      namespace: username,
    });

    //
    // sequential tweet chain begin --- >
    //
    /**
     * vector store results for notes similar to the original tweet
     */
    const searchRes = await vectorStore.similaritySearchWithScore(exampleTweet, 2);
    console.log('searchRes: ', searchRes);
    let notes = searchRes
      .filter((res) => res[1] > 0.7) // filter out strings that have less than %70 similarity
      .map((res) => res[0].pageContent)
      .join(' ');

    console.log('\n\nsimilarity search results [][][--0->', notes);

    if (!notes || notes.length <= 2) {
      notes = exampleTweet;
    }

    const tweetLlm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.8, // 0 - 2 with 0 being more deterministic and 2 being most "loose". Past 1.3 the results tend to be more incoherent.
      modelName: 'gpt-3.5-turbo',
    });

    let tweetTemplate = `You are an expert controversial idea generator. You will be given a user's notes and your goal is to use this information to brainstorm other novel ideas. 

	  Notes: {notes}
	
	  Ideas Brainstorm: 
	  -`;

    const tweetPromptTemplate = new PromptTemplate({
      template: tweetTemplate,
      inputVariables: ['notes'],
    });

    const tweetChain = new LLMChain({
      llm: tweetLlm,
      prompt: tweetPromptTemplate,
      outputKey: 'newTweetIdeas',
    });

    const interestingTweetTemplate = `You are an expert interesting tweet generator. You will be given some tweet ideas and your goal is to choose one, and write a tweet based on it. Structure the tweet in an informal yet serious tone and do NOT include hashtags in the tweet!
 
	  Tweet Ideas: {newTweetIdeas}
	  
	  Interesting Tweet:`;

    const interestingTweetLlm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 1.1,
      modelName: 'gpt-3.5-turbo',
    });

    const interestingTweetPrompt = new PromptTemplate({
      template: interestingTweetTemplate,
      inputVariables: ['newTweetIdeas'],
    });

    const interestingTweetChain = new LLMChain({
      llm: interestingTweetLlm,
      prompt: interestingTweetPrompt,
      outputKey: 'interestingTweet',
    });

    const overallChain = new SequentialChain({
      chains: [tweetChain, interestingTweetChain],
      inputVariables: ['notes'],
      outputVariables: ['newTweetIdeas', 'interestingTweet'],
      verbose: false,
    });

    type ChainDraftResponse = {
      newTweetIdeas: string;
      interestingTweet: string;
      notes: string;
    };

    const res1 = (await overallChain.call({
      notes,
    })) as ChainDraftResponse;

    return {
      ...res1,
      notes,
    };
  } catch (error: any) {
    throw new Error(error);
  }
};
