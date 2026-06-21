# Vocab Game — AWS Infrastructure

CDK stack that provisions:
- **Cognito User Pool** with Google + Facebook social login
- **DynamoDB** tables for user progress (scores, streaks, words learned) and settings (preferences, level)
- **SSM Parameters** so the app reads config at runtime without hardcoding

## Setup

### 1. Prerequisites
```bash
npm install -g aws-cdk
npm install          # inside this folder
aws configure        # make sure your AWS credentials are set
```

### 2. Configure credentials
```bash
cp .env.example .env
# fill in your Google and Facebook OAuth app credentials
```

**Google:** https://console.cloud.google.com/apis/credentials  
**Facebook:** https://developers.facebook.com/apps

Add your Cognito callback URL to both OAuth apps:
```
https://vocab-game-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
```

### 3. Deploy
```bash
cdk bootstrap   # first time only
cdk deploy
```

The outputs printed after deploy include your **User Pool ID**, **Client ID**, and **Cognito Domain** — paste those into your frontend `.env`.

## DynamoDB Schema

### `vocab-game-progress`
| Attribute | Type | Description |
|-----------|------|-------------|
| `userId` (PK) | String | Cognito `sub` |
| `wordsLearned` | Map | `{ wordId: { correct, attempts, lastSeen } }` |
| `quizScores` | List | `[{ date, score, category }]` |
| `streak` | Number | Current daily streak |
| `streakWeek` | String | ISO week key for GSI (`2024-W22`) |
| `totalCorrect` | Number | Lifetime correct answers |
| `totalAttempts` | Number | Lifetime attempts |
| `lastPlayed` | String | ISO timestamp |
| `displayName` | String | From OAuth profile |

### `vocab-game-settings`
| Attribute | Type | Description |
|-----------|------|-------------|
| `userId` (PK) | String | Cognito `sub` |
| `level` | String | `beginner` \| `intermediate` \| `advanced` |
| `dailyGoal` | Number | Words per day target |
| `uiTheme` | String | `light` \| `dark` |
| `notificationsEnabled` | Boolean | Daily reminder toggle |
| `preferredCategories` | List | e.g. `["food", "travel"]` |
| `updatedAt` | String | ISO timestamp |

## Tear down
```bash
cdk destroy
```
Note: Both DynamoDB tables have `RETAIN` removal policy — they won't be deleted automatically to protect your data.
