import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';

dotenv.config();

// ─── Stack ────────────────────────────────────────────────────────────────────

class VocabGameStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // ── DynamoDB: Progress ──────────────────────────────────────────────────
    // Stores quiz scores, words learned, streaks per user
    const progressTable = new dynamodb.Table(this, 'UserProgressTable', {
      tableName: 'vocab-game-progress',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // GSI: leaderboard by streak
    progressTable.addGlobalSecondaryIndex({
      indexName: 'streak-index',
      partitionKey: { name: 'streakWeek', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'streak', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['userId', 'displayName', 'wordsLearned'],
    });

    // ── DynamoDB: Settings ──────────────────────────────────────────────────
    // Stores UI preferences, level, daily goal
    const settingsTable = new dynamodb.Table(this, 'UserSettingsTable', {
      tableName: 'vocab-game-settings',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // ── Cognito User Pool ───────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'VocabGameUserPool', {
      userPoolName: 'vocab-game-users',
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
        profilePicture: { required: false, mutable: true },
      },
      customAttributes: {
        provider: new cognito.StringAttribute({ mutable: true }),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── Google IdP ──────────────────────────────────────────────────────────
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
      userPool,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecretValue: cdk.SecretValue.unsafePlainText(process.env.GOOGLE_CLIENT_SECRET!),
      scopes: ['openid', 'email', 'profile'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        fullname: cognito.ProviderAttribute.GOOGLE_NAME,
        profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
        custom: { provider: cognito.ProviderAttribute.other('provider') },
      },
    });

    // ── Facebook IdP ────────────────────────────────────────────────────────
    const facebookProvider = new cognito.UserPoolIdentityProviderFacebook(this, 'FacebookProvider', {
      userPool,
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      scopes: ['public_profile', 'email'],
      apiVersion: 'v19.0',
      attributeMapping: {
        email: cognito.ProviderAttribute.FACEBOOK_EMAIL,
        fullname: cognito.ProviderAttribute.FACEBOOK_NAME,
        custom: { provider: cognito.ProviderAttribute.other('provider') },
      },
    });

    // ── Cognito Hosted UI Domain ─────────────────────────────────────────────
    const userPoolDomain = userPool.addDomain('VocabGameDomain', {
      cognitoDomain: { domainPrefix: 'vocab-game-auth' },
    });

    // ── App Client (SPA / public) ────────────────────────────────────────────
    const callbackUrls = (process.env.CALLBACK_URLS ?? 'http://localhost:5173/callback').split(',');
    const logoutUrls   = (process.env.LOGOUT_URLS   ?? 'http://localhost:5173').split(',');

    const userPoolClient = userPool.addClient('VocabGameWebClient', {
      userPoolClientName: 'vocab-game-web',
      generateSecret: false,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls,
        logoutUrls,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
        cognito.UserPoolClientIdentityProvider.FACEBOOK,
      ],
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      preventUserExistenceErrors: true,
    });

    userPoolClient.node.addDependency(googleProvider);
    userPoolClient.node.addDependency(facebookProvider);

    // ── SSM Parameters ───────────────────────────────────────────────────────
    new ssm.StringParameter(this, 'UserPoolIdParam',    { parameterName: '/vocab-game/cognito/user-pool-id', stringValue: userPool.userPoolId });
    new ssm.StringParameter(this, 'ClientIdParam',      { parameterName: '/vocab-game/cognito/client-id',   stringValue: userPoolClient.userPoolClientId });
    new ssm.StringParameter(this, 'DomainParam',        { parameterName: '/vocab-game/cognito/domain',      stringValue: userPoolDomain.baseUrl() });
    new ssm.StringParameter(this, 'ProgressTableParam', { parameterName: '/vocab-game/dynamo/progress-table', stringValue: progressTable.tableName });
    new ssm.StringParameter(this, 'SettingsTableParam', { parameterName: '/vocab-game/dynamo/settings-table', stringValue: settingsTable.tableName });

    // ── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'UserPoolId',      { value: userPool.userPoolId,              description: 'Cognito User Pool ID' });
    new cdk.CfnOutput(this, 'UserPoolClientId',{ value: userPoolClient.userPoolClientId,  description: 'Cognito App Client ID' });
    new cdk.CfnOutput(this, 'CognitoDomain',   { value: userPoolDomain.baseUrl(),         description: 'Cognito Hosted UI base URL' });
    new cdk.CfnOutput(this, 'ProgressTable',   { value: progressTable.tableName });
    new cdk.CfnOutput(this, 'SettingsTable',   { value: settingsTable.tableName });
  }
}

// ─── App Entry ────────────────────────────────────────────────────────────────

const app = new cdk.App();

new VocabGameStack(app, 'VocabGameStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region:  process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
