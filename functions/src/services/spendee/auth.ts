import { logger } from 'firebase-functions';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from './config/firebase';
import { CollectionId, User } from './types';

export async function signInUser() {
    const userCredentials = await signInWithEmailAndPassword(
        auth,
        process.env.SPENDEE_EMAIL!,
        process.env.SPENDEE_PASSWORD!,
    );

    const meUid = userCredentials.user.uid;

    const me = (await getDoc(doc(db, CollectionId.Users, meUid))).data() as User;

    logger.log('signInUser', me);

    return {
        uid: meUid,
        walletIds: me.visibleWallets,
    } as const;
}
