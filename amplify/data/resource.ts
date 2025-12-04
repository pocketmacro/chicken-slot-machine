import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Prize: a
    .model({
      name: a.string().required(),
      description: a.string(),
      redirectUrls: a.string().array().required(),
      imageUrl: a.string(),
      color: a.string(),
      weight: a.integer().default(10),
      quantity: a.integer().default(1),
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
