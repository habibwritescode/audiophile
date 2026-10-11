'use client';

import { useRouter } from 'next/navigation';

const GoBack = () => {
  const router = useRouter();

  // A page opened directly (new tab, shared link) has no history to go back to
  const handleClick = () => (window.history.length > 1 ? router.back() : router.push('/'));

  return (
    <button
      onClick={handleClick}
      className="cursor-pointer text-15 text-black/60 transition-colors hover:text-primary active:text-primary"
    >
      Go Back
    </button>
  );
};

export default GoBack;
