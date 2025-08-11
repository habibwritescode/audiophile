'use client';

import { useRouter } from 'next/navigation';

const GoBack = () => {
  const router = useRouter();

  return (
    <button onClick={() => router.back()} className={`cursor-pointer text-15 text-black/50`}>
      Go Back
    </button>
  );
};

export default GoBack;
