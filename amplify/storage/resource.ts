import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'prizeImages',
  access: (allow) => ({
    'prize-images/*': [
      allow.authenticated.to(['read']),
      allow.group('admins').to(['read', 'write', 'delete'])
    ],
  })
});
