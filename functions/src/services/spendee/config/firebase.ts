import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp({
    apiKey: 'AIzaSyCCJPDxVNVFEARQ-LxH7q2aZtdQJGGFO84',
    authDomain: 'spendee-app.firebaseapp.com',
    databaseURL: 'https://spendee-app.firebaseio.com',
    projectId: 'spendee-app',
    storageBucket: 'spendee-app.appspot.com',
    messagingSenderId: '320191066468',
    appId: '1:320191066468:web:b91a0a66620b3912',
    measurementId: 'G-6XWQZRWRLK',
});

export const db = getFirestore(app);

export const auth = getAuth(app);
