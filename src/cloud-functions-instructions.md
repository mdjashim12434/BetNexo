# Firebase Functions Setup for Sportmonks API

এই ফাইলটিতে Sportmonks API কল করার জন্য একটি Firebase Function সেটআপ করার সম্পূর্ণ কোড এবং নির্দেশাবলী রয়েছে।

**আমি আপনার জন্য ফাংশনটি ডিপ্লয় করতে পারি না, তবে নিচের ধাপগুলো অনুসরণ করে আপনি সহজেই এটি করতে পারবেন।**

## ধাপ ১: Firebase Functions সেটআপ করুন

আপনার প্রজেক্টের রুট ফোল্ডারে টার্মিনাল খুলুন এবং এই কমান্ডটি চালান:

```bash
firebase init functions
```

আপনাকে কিছু প্রশ্ন করা হবে:
- **Language:** `TypeScript` সিলেক্ট করুন।
- **ESLint:** `Yes` সিলেক্ট করতে পারেন।
- **Install dependencies:** `Yes` সিলেক্ট করুন।

এটি আপনার প্রজেক্টে `functions` নামে একটি নতুন ফোল্ডার তৈরি করবে।

## ধাপ ২: `functions` ফোল্ডারের ফাইলগুলো আপডেট করুন

`firebase init` কমান্ডটি `functions` ফোল্ডারে কিছু ডিফল্ট ফাইল তৈরি করবে। আপনাকে নিচের কোড দিয়ে সেগুলো পরিবর্তন করতে হবে।

### `functions/package.json`

এই ফাইলটির সম্পূর্ণ কন্টেন্ট নিচের কোড দিয়ে প্রতিস্থাপন করুন:

```json
{
  "name": "functions",
  "description": "Cloud Functions for Firebase",
  "scripts": {
    "lint": "eslint . --ext .js,.ts",
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "axios": "^1.7.2",
    "cors": "^2.8.5",
    "firebase-admin": "^12.1.0",
    "firebase-functions": "^5.0.1"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^5.12.0",
    "@typescript-eslint/parser": "^5.12.0",
    "eslint": "^8.9.0",
    "eslint-config-google": "^0.14.0",
    "eslint-plugin-import": "^2.25.4",
    "typescript": "^5.0.0"
  },
  "private": true
}
```

### `functions/src/index.ts`

`functions/src/` ফোল্ডারের `index.ts` ফাইলটির সম্পূর্ণ কন্টেন্ট নিচের কোড দিয়ে প্রতিস্থাপন করুন:

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import * as cors from "cors";

// Initialize Firebase Admin SDK
admin.initializeApp();

const corsHandler = cors({ origin: true });

// Switched to Cricket API v2.0
const SPORTMONKS_API_BASE_URL = "https://cricket.sportmonks.com/api/v2.0/livescores";

export const getLiveScores = functions.https.onRequest((request, response) => {
  // Handle CORS for the web app
  corsHandler(request, response, async () => {
    try {
      const apiKey = functions.config().sportmonks.key;
      if (!apiKey) {
        functions.logger.error("Sportmonks API key is not set in Firebase functions config.");
        response.status(500).send("API key is not configured on the server.");
        return;
      }
      
      // V2 endpoint does not use 'includes' in the same way, can be added if needed for specific data
      const url = `${SPORTMONKS_API_BASE_URL}?api_token=${apiKey}`;

      functions.logger.info("Fetching live cricket scores from Sportmonks...");

      const apiResponse = await axios.get(url);

      response.status(200).json(apiResponse.data);
    } catch (error) {
      functions.logger.error("Error fetching from Sportmonks API:", error);
      if (axios.isAxiosError(error) && error.response) {
        // Forward the error from Sportmonks API
        response.status(error.response.status).send(error.response.data);
      } else {
        response.status(500).send("An internal server error occurred.");
      }
    }
  });
});
```

### `functions/tsconfig.json`

নিশ্চিত করুন আপনার `functions/tsconfig.json` ফাইলটি এইরকম দেখাচ্ছে:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017",
    "esModuleInterop": true
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}
```

## ধাপ ৩: API Key সেট করুন

আপনার Sportmonks API Key-টি સુરক্ষিতভাবে সেট করতে, আপনার প্রজেক্টের রুট ফোল্ডার থেকে টার্মিনালে এই কমান্ডটি চালান। `YOUR_API_KEY` এর জায়গায় আপনার আসল কী ব্যবহার করুন:

```bash
firebase functions:config:set sportmonks.key="Sonl5gwGyZ8foO2GWb3wWUnr9ZLH8fw0AY1pmskShYaLRP6ADftVL3Q92k9R"
```

## ধাপ ৪: ফাংশন ডিপ্লয় করুন

সবকিছু ঠিক থাকলে, এখন ফাংশনটি ডিপ্লয় করার পালা। টার্মিনালে এই কমান্ডটি চালান:

```bash
firebase deploy --only functions
```

ডিপ্লয় সম্পন্ন হলে, টার্মিনালে আপনি আপনার ফাংশনের URL দেখতে পাবেন। এটি `https://<region>-<project-id>.cloudfunctions.net/getLiveScores` এর মতো দেখতে হবে।

## ধাপ ৫: Next.js অ্যাপে URL ব্যবহার করুন

ডিপ্লয় করার পর যে URL-টি পাবেন, সেটি আপনার Next.js অ্যাপের `src/services/sportmonksAPI.ts` ফাইলে ব্যবহার করতে হবে। আমি ফাইলটি আপডেট করে একটি placeholder URL যোগ করে দিয়েছি। আপনাকে শুধু সেই placeholder টি আপনার আসল URL দিয়ে পরিবর্তন করতে হবে।
