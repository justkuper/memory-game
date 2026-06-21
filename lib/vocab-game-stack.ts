import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface VocabGameStackProps extends cdk.StackProps {
  googleClientId: string;
  googleClientSecret: string;
  facebookAppId: string;
  facebookAppSecret: string;
  callbackUrls: string[];
  logoutUrls: string[];
}

export class VocabGameStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VocabGameStackProps) {
    super(scope, id, props);

    // ─── DynamoDB: User Progress ────────────────────────────────────────────
    // Stores quiz scores, words learned, streaks per user
    const progressTable = new dynamodb.Table(this, 'UserProgressTable', {
      tableName: 'vocab-game-progress',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // GSI: look up all users by streak (leaderboard use case)
    progressTable.addGlobalSecondaryIndex({
      indexName: 'streak-index',
      partitionKey: { name: 'streakWeek', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'streak', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['userId', 'displayName', 'wordsLearned'],
    });

    // ─── DynamoDB: User Settings ─────────────────────────────────────────────
    // Stores UI preferences, level, daily goal, notification prefs
    const settingsTable = new dynamodb.Table(this, 'UserSettingsTable', {
      tableName: 'vocab-game-settings',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // ─── Cognito User Pool ───────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'VocabGameUserPool', {
      userPoolName: 'vocab-game-users',
      selfSignUpEnabled: false,          // social login only
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
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ─── Google Identity Provider ────────────────────────────────────────────
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
      this,
      'GoogleProvider',
      {
        userPool,
        clientId: props.googleClientId,
        clientSecretValue: cdk.SecretValue.unsafePlainText(props.googleClientSecret),
        scopes: ['openid', 'email', 'profile'],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          fullname: cognito.ProviderAttribute.GOOGLE_NAME,
          profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
          custom: {
            provider: cognito.ProviderAttribute.other('provider'),
          },
        },
      }
    );

    // ─── Facebook Identity Provider ──────────────────────────────────────────
    const facebookProvider = new cognito.UserPoolIdentityProviderFacebook(
      this,
      'FacebookProvider',
      {
        userPool,
        clientId: props.facebookAppId,
        clientSecret: props.facebookAppSecret,
        scopes: ['public_profile', 'email'],
        apiVersion: 'v19.0',
        attributeMapping: {
          email: cognito.ProviderAttribute.FACEBOOK_EMAIL,
          fullname: cognito.ProviderAttribute.FACEBOOK_NAME,
          custom: {
            provider: cognito.ProviderAttribute.other('provider'),
          },
        },
      }
    );

    // ─── Cognito Domain (hosted UI) ──────────────────────────────────────────
    const userPoolDomain = userPool.addDomain('VocabGameDomain', {
      cognitoDomain: {
        // Change this prefix to something unique for your app
        domainPrefix: 'vocab-game-auth',
      },
    });

    // ─── App Client ──────────────────────────────────────────────────────────
    const userPoolClient = userPool.addClient('VocabGameWebClient', {
      userPoolClientName: 'vocab-game-web',
      generateSecret: false,         // public client (SPA)
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: props.callbackUrls,
        logoutUrls: props.logoutUrls,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
        cognito.UserPoolClientIdentityProvider.FACEBOOK,
      ],
      // Token validity
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      preventUserExistenceErrors: true,
    });

    // Ensure providers are created before the client
    userPoolClient.node.addDependency(googleProvider);
    userPoolClient.node.addDependency(facebookProvider);

    // ─── SSM Parameters (so your app can read config without hardcoding) ─────
    new ssm.StringParameter(this, 'UserPoolIdParam', {
      parameterName: '/vocab-game/cognito/user-pool-id',
      stringValue: userPool.userPoolId,
    });

    new ssm.StringParameter(this, 'UserPoolClientIdParam', {
      parameterName: '/vocab-game/cognito/client-id',
      stringValue: userPoolClient.userPoolClientId,
    });

    new ssm.StringParameter(this, 'CognitoDomainParam', {
      parameterName: '/vocab-game/cognito/domain',
      stringValue: userPoolDomain.baseUrl(),
    });

    new ssm.StringParameter(this, 'ProgressTableNameParam', {
      parameterName: '/vocab-game/dynamo/progress-table',
      stringValue: progressTable.tableName,
    });

    new ssm.StringParameter(this, 'SettingsTableNameParam', {
      parameterName: '/vocab-game/dynamo/settings-table',
      stringValue: settingsTable.tableName,
    });

    // ─── Stack Outputs ───────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'VocabGameUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito App Client ID',
      exportName: 'VocabGameClientId',
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: userPoolDomain.baseUrl(),
      description: 'Cognito Hosted UI base URL',
      exportName: 'VocabGameCognitoDomain',
    });

    new cdk.CfnOutput(this, 'ProgressTableName', {
      value: progressTable.tableName,
      exportName: 'VocabGameProgressTable',
    });

    new cdk.CfnOutput(this, 'SettingsTableName', {
      value: settingsTable.tableName,
      exportName: 'VocabGameSettingsTable',
    });
  }
}
