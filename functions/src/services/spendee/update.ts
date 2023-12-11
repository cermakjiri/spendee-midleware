import { logger } from 'firebase-functions';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';

import { config } from '../../config';
import { Me } from './auth';
import { db } from './config/firebase';
import { CollectionId, Transaction } from './types';

export async function updateTransactionsCategory(me: Me, transactions: Transaction[]) {
    const batch = writeBatch(db);
    const batchSize = 50;
    let batchCount = 1;
    const totalBatchCount = Math.ceil(transactions.length / batchSize);

    logger.log(`Updating transactions by ${batchSize} items at once. Total items to update:`, transactions);

    while (transactions.length > 0) {
        const batchPayload = transactions.splice(0, batchSize);

        batchPayload.forEach(transaction => {
            const transactionRef = doc(
                db,
                CollectionId.Users,
                me.uid,
                CollectionId.Wallets,
                me.walletId,
                CollectionId.Transactions,
                transaction.path.transaction,
            );

            const { category, modelVersion, note, path, type } = transaction;

            batch.update(transactionRef, {
                category,
                modelVersion,
                note,
                path,
                type,
                updatedAt: serverTimestamp(),
            });
        });

        logger.log(`(${batchCount / totalBatchCount}): Updating ${batchPayload.length} items...`, batchPayload);

        if (!config.dryRun) {
            await batch.commit();
        }

        logger.log(`(${batchCount / totalBatchCount}): ${batchPayload.length} items updated.`);

        batchCount++;
    }

    logger.log('All items updated.');
}
