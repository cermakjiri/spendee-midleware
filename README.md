# Spendee middleware 

The purpose of this repo is to hot fix currently (2023-12-10) broken automatic caregorization of Spendee transactions after sync from a bank.

It signs in with your Spendee credentials to fetch your transactions without a category. If some found, it attempts to fill-up them as: 
1. Complete missing transactions categories based on already categorized transactions with similar note.
  - Try to do exact match.
  - Else use Levenshtein distance.
  - Completed transactions are updated at database.
2. If there're still some transactions without category, ask Chat GPT to choose correct category based on transaction note.
 - It only chooses from existing categories.
 - Completed transactions are updated at database.
3. If even now there're some incomplete transactions, just log them out and end the script.

This runs regularly every day at 7:00 AM (Europe/Prague) as a pubsub Cloud Function.

## Development

1. Create `functions/.env` with:
    ```
    SPENDEE_EMAIL=""
    SPENDEE_PASSWORD=""

    OPENAI_API_KEY=""
    ```
2. Go to `functions` and install dependencies
    ```
    yarn
    ```

## Deployment

1. `firebase login`
2. `yarn deploy`