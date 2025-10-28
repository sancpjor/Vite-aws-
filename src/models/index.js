// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const { LeaderboardEntry, QuizStats } = initSchema(schema);

export {
  LeaderboardEntry,
  QuizStats
};
