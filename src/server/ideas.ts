import type { EmbedIdea, GenerateNewIdeas } from '@wasp/actions/types';
import type { GeneratedIdea } from '@wasp/entities';
import HttpError from '@wasp/core/HttpError.js';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeClient } from '@pinecone-database/pinecone';
import { generateIdeas } from './chain.js'; // < ---- this too -----
import { Rettiwt } from 'rettiwt-api'; // < ---- and this here -----
const twitter = Rettiwt(); // < ---- and this -----
import type { GetTweetDraftsWithIdeas, GetEmbeddedNotes } from '@wasp/queries/types';

const pinecone = new PineconeClient();
export const initPinecone = async () => {
  await pinecone.init({
    environment: process.env.PINECONE_ENV!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
  return pinecone;
};

export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * Embeds a single idea into the vector store
 */
export const embedIdea: EmbedIdea<{ idea: string }, GeneratedIdea> = async ({ idea }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  console.log('idea: ', idea);

  try {
    let newIdea = await context.entities.GeneratedIdea.create({
        data: {
          content: idea,
          userId: context.user.id,
        },
      });
    

    if (!newIdea) {
      throw new HttpError(404, 'Idea not found');
    }

    const pinecone = await initPinecone();
		
		// we need to create an index to save the vector embeddings to
		// an index is similar to a table in relational database world
		const availableIndexes = await pinecone.listIndexes();
		if (!availableIndexes.includes('embeds-test')) {
		    console.log('creating index');
		    await pinecone.createIndex({
		      createRequest: {
		        name: 'embeds-test',
						// open ai uses 1536 dimensions for their embeddings
		        dimension: 1536, 
		      },
		    });
		  }

    const pineconeIndex = pinecone.Index('embeds-test');
		
		// the LangChain vectorStore wrapper
    const vectorStore = new PineconeStore(embeddings, {
      pineconeIndex: pineconeIndex,
      namespace: context.user.username,
    });
		
		// create a document with the idea's content to be embedded
    const ideaDoc = new Document({
      metadata: { type: 'note' },
      pageContent: newIdea.content,
    });
		
		// add the document to the vectore store along with its id
    await vectorStore.addDocuments([ideaDoc], [newIdea.id.toString()]);

    newIdea = await context.entities.GeneratedIdea.update({
      where: {
        id: newIdea.id,
      },
      data: {
        isEmbedded: true,
      },
    });
    console.log('idea embedded successfully!', newIdea);
    return newIdea;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const generateNewIdeas: GenerateNewIdeas<never, void> = async (_args, context) => {
	try {
    // get the logged in user that Wasp passes to the action via the context
    const user = context.user

    if (!user) {
      throw new HttpError(401, 'User is not authorized');
    }

      for (let h = 0; h < user.favUsers.length; h++) {
        const favUser = user.favUsers[h];
        const userDetails = await twitter.users.getUserDetails(favUser);
        const favUserTweets = await twitter.users.getUserTweets(userDetails.id);
				// filter out retweets
        let favUserTweetTexts = favUserTweets.list.filter((tweet) => !tweet.fullText.startsWith('RT'));
        favUserTweetTexts = favUserTweetTexts.filter((tweet) => {
          // filter out tweets that were created more than 24 hours ago
          const createdAt = new Date(tweet.createdAt); // createdAt: 'Wed May 24 03:41:53 +0000 2023'
          const now = new Date();
          const twelveHoursAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
          return createdAt > twelveHoursAgo;
        });

        for (let i = 0; i < favUserTweetTexts.length; i++) {
          const tweet = favUserTweetTexts[i];

					const tweets = await context.entities.User.findFirst({
            where: {
              id: user.id,
            },
            select: {
              originalTweets: {
                where: {
                  tweetId: tweet.id,
                },
              },
            },
          });

          const originalTweets = tweets?.originalTweets;

          /** 
           * If the tweet already exists in the database, skip generating drafts and ideas for it.
           */
          if (originalTweets?.length && originalTweets.length > 0) {
            console.log('tweet already exists in db, skipping generating drafts...');
            continue;
          }
          
          /**
           * this is where the magic happens
           */
          const draft = await generateIdeas(tweet.fullText, user.username);
          console.log('draft: ', draft);

          const originalTweet = await context.entities.Tweet.create({
            data: {
              tweetId: tweet.id,
              content: tweet.fullText,
              authorUsername: userDetails.userName,
              tweetedAt: new Date(tweet.createdAt),
							userId: user.id
            },
          });

          let newTweetIdeas = draft.newTweetIdeas.split('\n');
          newTweetIdeas = newTweetIdeas
            .filter((idea) => idea.trim().length > 0)
            .map((idea) => {
              // remove all dashes that are not directly followed by a letter
              idea = idea.replace(/-(?![a-zA-Z])/g, '');
              idea = idea.replace(/"/g, '');
              idea = idea.replace(/{/g, '');
              idea = idea.replace(/}/g, '');
              // remove hashtags and the words that follow them
              idea = idea.replace(/#[a-zA-Z0-9]+/g, '');
              idea = idea.replace(/^\s*[\r\n]/gm, ''); // remove new line breaks
              idea = idea.trim();
              // check if last character contains punctuation and if not add a period
              if (idea.length > 1 && !idea[idea.length - 1].match(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g)) {
                idea += '.';
              }
              return idea;
            });
          for (let j = 0; j < newTweetIdeas.length; j++) {
            const newTweetIdea = newTweetIdeas[j];
            const newIdea = await context.entities.GeneratedIdea.create({
              data: {
                content: newTweetIdea,
                originalTweetId: originalTweet.id,
								userId: user.id
              },
            });
            console.log('newIdea saved to DB: ', newIdea);
          }

          const interestingTweetDraft = await context.entities.TweetDraft.create({
            data: {
              content: draft.interestingTweet,
              originalTweetId: originalTweet.id,
              notes: draft.notes,
							userId: user.id
            },
          });

          console.log('interestingTweetDraft saved to DB: ', interestingTweetDraft);

          // create a delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));

        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

  } catch (error: any) {
    console.log('error', error);
    throw new HttpError(500, error);
  }
}

type TweetDraftsWithIdeas = {
  id: number;
  content: string;
  notes: string;
  createdAt: Date;
  originalTweet: {
    id: number;
    content: string;
    tweetId: string;
    tweetedAt: Date;
    ideas: GeneratedIdea[];
    authorUsername: string;
  };
}[];

export const getTweetDraftsWithIdeas: GetTweetDraftsWithIdeas<never, TweetDraftsWithIdeas> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  const drafts = await context.entities.TweetDraft.findMany({
    orderBy: {
      originalTweet: {
        tweetedAt: 'desc',
      },
    },
    where: {
      userId: context.user.id,
      createdAt: {
        gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Get drafts created within the last 2 days
      },
    },
    select: {
      id: true,
      content: true,
      notes: true,
      createdAt: true,
      originalTweet: {
        select: {
          id: true,
          tweetId: true,
          content: true,
          ideas: true,
          tweetedAt: true,
          authorUsername: true,
        },
      },
    },
  });

  return drafts;
};

export const getEmbeddedNotes: GetEmbeddedNotes<never, GeneratedIdea[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  const notes = await context.entities.GeneratedIdea.findMany({
    where: {
      userId: context.user.id,
      isEmbedded: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return notes;
}