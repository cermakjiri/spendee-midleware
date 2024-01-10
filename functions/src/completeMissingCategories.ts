import { logger } from 'firebase-functions';

import {
    completeMissingCategoriesBasedOnSimilarTransactions,
    completeMissingCategoriesWithGpt,
    fetchCategories,
    fetchTransactions,
    signInUser,
} from './services/spendee';
import { Category } from './services/spendee/types';
import { UserWithWallet } from './types';

async function completeCategoriesInWallet(me: UserWithWallet, categoriesById: Map<string, Category>) {
    const transactions = await fetchTransactions(me.uid, me.walletId);

    const transactionsWithCategory = transactions.filter(t => t.category && categoriesById.has(t.category));
    let transactionsWithoutCategory = transactions.filter(t => !t.category || !categoriesById.has(t.category));

    if (transactionsWithoutCategory.length === 0) {
        logger.log('All transactions have set category.');
        return;
    }

    logger.log('transactions:', {
        withCategory: transactionsWithCategory.length,
        withoutCategory: transactionsWithoutCategory.length,
    });

    // try to fill-in missing categories based on transaction note from other transactions with the same note
    transactionsWithoutCategory = await completeMissingCategoriesBasedOnSimilarTransactions(me, {
        transactionsWithCategory,
        transactionsWithoutCategory,
        categoriesById,
    });

    if (transactionsWithoutCategory.length === 0) {
        logger.log('[transactions similarity]: All transactions without category have been completed.');
        return;
    }

    logger.log('Using GPT API to detect correct category:', {
        count: transactionsWithoutCategory.length,
        transactions: transactionsWithoutCategory,
    });

    // else we need to categorize the remaining transactions with GPT API
    transactionsWithoutCategory = await completeMissingCategoriesWithGpt(me, {
        transactionsWithoutCategory,
        categoriesById,
    });

    if (transactionsWithoutCategory.length === 0) {
        logger.log('[GPT]: All transactions without category have been completed with the help of GPT.');
        return;
    }

    logger.log(
        `Some transactions couldn't been categorized:`,
        transactionsWithoutCategory.map(t => ({
            path: t.path,
            usdValue: t.usdValue,
            note: t.note,
            amount: t.amount,
        })),
    );
}

export async function completeMissingCategories() {
    const me = await signInUser();

    const categoriesById = await fetchCategories(me.uid);

    logger.log('categoriesById:', Object.fromEntries(categoriesById.entries()));

    for (const walletId of me.walletIds) {
        logger.log('walletId started:', walletId);
        await completeCategoriesInWallet(
            {
                uid: me.uid,
                walletId,
            },
            categoriesById,
        );
        logger.log('walletId completed:', walletId);
    }
}
