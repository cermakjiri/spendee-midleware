import 'dotenv/config';

import { completeMissingCategories } from './completeMissingCategories';

export async function main() {
    console.log('Running completeMissingCategories function locally...');
    await completeMissingCategories();
    console.log('completeMissingCategories function finished running locally.');
}

main();
