Here’s a general approach + example code for how you can hook into SuperTokens’ passwordless login / signup flow (via phone) in a Next.js / Node backend, get the SuperTokens user (UUID, phone number, etc.), and then call your own createUser in your SQL DB (if the user is new).

You’ll want to override or hook into the backend functions of the Passwordless recipe (especially consumeCode) so that when login/signup completes, you can do your DB user creation logic. SuperTokens supports “override” for its recipes. 

Below is a sketch + code example. You’ll need to adapt to your SQL / ORM setup (Prisma, TypeORM, knex, etc.).

## High-level flow

1. Frontend: user enters phone → you call Passwordless.createCode({ phoneNumber })

2. Frontend: user enters the SMS code / clicks magic link → you call Passwordless.consumeCode(...)

3. Backend: the consumeCode call runs (via SuperTokens backend API) — either it logs in an existing user or signs up a new one
4. Override in backend: after consumeCode succeeds with status "OK", you get response.user which has the SuperTokens user ID (UUID) and phoneNumber, and a flag createdNewRecipeUser indicating whether this was a new user in SuperTokens.

5. Based on that, inside your override you can call your custom createUserInSqlDb(...) (if new) or fetch existing, etc.

6. Return the same result so SuperTokens proceeds with session creation etc.

## Example Code Sketch (Node / Next.js API route)

Here’s a simplified sketch. Let’s assume you have a file like pages/api/auth/[...supertokens].ts (or your backend init file) where you init SuperTokens:

```
import SuperTokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import Passwordless from "supertokens-node/recipe/passwordless";
import { appInfo, backendConfig } from "./config";  // your config, connection URI, etc.

// Suppose you have some SQL / ORM helper:
import { getUserBySupertokensId, createUserInSql } from "../../lib/userModel";

SuperTokens.init({
  ...backendConfig(),
  recipeList: [
    Passwordless.init({
      contactMethod: "PHONE",  // or "EMAIL_OR_PHONE" depending on your setup
      flowType: "USER_INPUT_CODE", // or Magic Link, etc
      override: {
        functions: (originalImpl) => {
          return {
            ...originalImpl,
            consumeCode: async (input) => {
              // Call original consumeCode first
              const response = await originalImpl.consumeCode(input);

              if (response.status === "OK") {
                const user = response.user;  // SuperTokens user object
                const superTokenUserId = user.id;
                const phoneNumbers = user.phoneNumbers;  // array of phone numbers
                
                // You can check if this is a new user
                const isNewUser = response.createdNewRecipeUser;

                // If new, create your custom user record in your SQL DB
                if (isNewUser) {
                  // you might choose the first phone number or handle multiple
                  const phoneNumber = phoneNumbers.length > 0 ? phoneNumbers[0].phoneNumber : undefined;

                  // optionally, you can check if there's an existing user record by phone
                  const existing = await getUserBySupertokensId(superTokenUserId);
                  if (!existing) {
                    await createUserInSql({
                      superTokenUserId,
                      phoneNumber,
                      // any other default fields
                    });
                  }
                } else {
                  // optional: update last login timestamp, sync phoneNumber, etc
                  // e.g. fetch your SQL user record and update fields
                }
              }

              return response;
            }
          };
        }
      }
    }),
    Session.init(),
    // ... other recipes if you use them
  ],
});
```

In this setup:

* You override consumeCode: that's invoked after the user enters the code / uses magic link. This is the spot where authentication is confirmed.

* response.user gives you id, phoneNumbers, etc.

* response.createdNewRecipeUser is true if this is the first time this user is being signed up in SuperTokens via this recipe.

* You then call your createUserInSql(...) with that id, phone number, etc.

Also (optionally) you can override “APIs” (e.g. consumeCodePOST) if you want more control over the HTTP layer. But overriding functions.consumeCode is usually enough. 
SuperTokens

## On the Frontend: detecting new vs existing user

On the frontend, SuperTokens allows you to hook into events. In supertokens-auth-react when you initialize the Passwordless recipe, you can pass an onHandleEvent callback. In that callback, if context.action === "SUCCESS", you can check context.isNewRecipeUser (whether it’s a new user) and context.user (which contains id, phoneNumbers, etc.). 

Example:
```
SuperTokens.init({
  appInfo: { ... },
  recipeList: [
    Passwordless.init({
      contactMethod: "PHONE",
      onHandleEvent: async (context) => {
        if (context.action === "SUCCESS") {
          const user = context.user;
          const isNew = context.isNewRecipeUser;
          // e.g. call your frontend API or redirect accordingly
          if (isNew) {
            // first time signup
            console.log("New user signed up:", user.id, user.phoneNumbers);
          } else {
            console.log("Existing user signed in:", user.id, user.phoneNumbers);
          }
        }
      },
    }),
    Session.init(),
  ],
});
```

This is useful if you want to trigger UI behavior (e.g. ask for extra profile info for new users, etc.).

## Things to watch out for / best practices

* Don’t call signInUp from inside createCode override — that can lead to infinite loops. As noted in the SuperTokens community, one user tried calling signInUp inside createCodePOST and got stuck in loops. Instead, use the consumeCode override. 
SuperTokens.com #general

* Persist any extra metadata you need outside of SuperTokens (in your own user table).

* Use the preAuthSessionId (if needed) if you want to store intermediate state from createCode to consumeCode.

* Check whether user.loginMethods.length === 1 to detect that it's the first method the user used to sign up (if you support multiple recipes).

* Ensure your SQL createUserInSql is idempotent (i.e. doesn’t crash if user record already exists).
* Be cautious with error handling — if your DB call fails, you might want to handle or propagate gracefully.