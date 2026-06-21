#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VocabGameStack } from '../lib/vocab-game-stack';
import * as dotenv from 'dotenv';

dotenv.config();

const app = new cdk.App();

new VocabGameStack(app, 'VocabGameStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  facebookAppId: process.env.FACEBOOK_APP_ID!,
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET!,
  callbackUrls: (process.env.CALLBACK_URLS ?? 'http://localhost:5173/callback').split(','),
  logoutUrls: (process.env.LOGOUT_URLS ?? 'http://localhost:5173').split(','),
});
