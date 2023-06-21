import { useState } from 'react';
import generateNewIdeas from '@wasp/actions/generateNewIdeas';
import { useQuery } from '@wasp/queries';
import getTweetDraftsWithIdeas from '@wasp/queries/getTweetDraftsWithIdeas';
import Button from './Button';
import { TwitterTweetEmbed } from 'react-twitter-embed';

const MainPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    data: tweetDrafts,
    isLoading: isTweetDraftsLoading,
    error: tweetDraftsError,
  } = useQuery(getTweetDraftsWithIdeas);

  const handleNewIdeas = async (e: any) => {
    try {
      setIsGenerating(true);
      await generateNewIdeas();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isTweetDraftsLoading) {
    return 'Loading...';
  }

  if (tweetDraftsError) {
    return 'Error: ' + tweetDraftsError.message;
  }

  return (
    <>
      <div className='flex flex-row justify-center w-full'>
        <Button onClick={handleNewIdeas} isLoading={isGenerating}>
          Generate New Ideas
        </Button>
      </div>
      <div className='flex flex-col gap-4 justify-center items-center w-full'>
        {tweetDrafts.map((tweetDraft) => (
          <>
            <h2 className='text-2xl font-bold'>Generated Ideas</h2>
            <div key={tweetDraft.id} className='flex flex-col gap-2 justify-center items-center w-full'>
              <h2>Original Tweet</h2>
              <div className='flex flex-row gap-2 justify-center items-center w-full'>
                <TwitterTweetEmbed tweetId={tweetDraft.originalTweet.tweetId} />
              </div>
              <h2>Tweet Draft</h2>
              <div className='flex flex-row gap-2 justify-center items-center w-full'>
                <div className='w-full p-4 h-22 bg-blue-100 border rounded-lg w-full'>{tweetDraft.content}</div>
              </div>

              {!!tweetDraft.notes && tweetDraft.notes !== tweetDraft.originalTweet.content && (
                <>
                  <h2>Your Similar Notes</h2>
                  {tweetDraft.notes}
                </>
              )}
              <div className='flex flex-col gap-2 justify-center items-center w-full'>
                <h2>Ideas</h2>
                {tweetDraft.originalTweet.ideas.map((idea) => (
                  <div key={idea.id} className='flex flex-row gap-2 justify-center items-center w-full'>
                    <div className='flex flex-row gap-2 justify-center items-center w-full'>
                      <div className='w-full p-4 h-22 bg-neutral-100 border rounded-lg w-full'>{idea.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ))}
      </div>
    </>
  );
};
export default MainPage;
