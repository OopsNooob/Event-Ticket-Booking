'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpCatchAll() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <SignUp
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
      />
    </div>
  );
}
