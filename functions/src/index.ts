import 'dotenv/config';

import * as functions from 'firebase-functions';

import { completeMissingCategories } from './completeMissingCategories';

// Run every day at 7am
export const missingCategoriesCheck = functions
    .region('europe-west3')
    .pubsub.schedule('0 6 * * *')
    .timeZone('Europe/Prague')
    .onRun(completeMissingCategories);
