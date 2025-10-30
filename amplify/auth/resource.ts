// amplify/auth/resource.ts
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'ZAZ Football Quiz - Verify your email',
      verificationEmailBody: (createCode) =>
        `Use this code to verify your email: ${createCode()}`,
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    preferred_username: {
      required: true,
      mutable: false,
    },
  },
});

