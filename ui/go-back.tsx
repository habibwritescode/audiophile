'use client';

import { useRouter } from 'next/navigation';

const GoBack = () => {
  const router = useRouter();

  // A page opened directly (new tab, shared link) has no history to go back to
  const handleClick = () => (window.history.length > 1 ? router.back() : router.push('/'));

  return (
    <button onClick={handleClick} className={`cursor-pointer text-15 text-black/50`}>
      Go Back
    </button>
  );
};

export default GoBack;
