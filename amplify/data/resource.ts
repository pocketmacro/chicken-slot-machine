import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Prize: a
    .model({
      name: a.string().required(),
      description: a.string(),
      redirectUrl: a.string().required(),
      color: a.string(),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.group('admins'),
    ]),

  UserSpin: a
    .model({
      userId: a.string().required(),
      lastSpinTime: a.datetime().required(),
      prizesWon: a.string().array(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('admins'),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
