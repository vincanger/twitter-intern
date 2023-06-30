import { Rettiwt } from 'rettiwt-api'; 

/**
 * This is a script we can now run from the cli with `wasp db seed`
 * IMPORTANT! We only want to run this script once, after which we save the tokens
 * in the .env.server file. They should be good for up to a year.
 */
export const getTwitterTokens = async () => {
  const tokens = await Rettiwt().account.login(
    process.env.TWITTER_EMAIL!,
    process.env.TWITTER_HANDLE!,
    process.env.TWITTER_PASSWORD!
  );

  console.log('tokens: ', tokens)
};
