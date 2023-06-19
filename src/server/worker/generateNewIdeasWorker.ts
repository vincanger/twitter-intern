import { generateNewIdeas } from '../ideas.js';

export default async function generateNewIdeasWorker(_args: unknown, context: any) {
  try {
    console.log('Running recurring task: generateNewIdeasWorker')
    const allUsers = await context.entities.User.findMany({});

    for (const user of allUsers) {
      context.user = user;
      console.log('Generating new ideas for user: ', user.username);
      await generateNewIdeas(undefined as never, context);
      console.log('Done generating new ideas for user: ', user.username)
    }

  } catch (error: any) {
    console.log('Recurring task error: ', error);
  }
}