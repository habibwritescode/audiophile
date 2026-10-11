import { cn } from '@/lib/helpers';

// The design's three 16×3 bars (y = 0, 6, 12). Open, the outer bars meet in the middle and turn
// into an X; the middle one fades. On-screen movement, so ease-in-out; instant with reduced motion.
const BAR =
  'absolute left-0 h-[3px] w-4 bg-white transition-[translate,rotate,opacity] duration-200 ease-in-out motion-reduce:transition-none';

const MenuIcon = ({ open }: { open: boolean }) => (
  <span aria-hidden="true" className="relative block h-[15px] w-4">
    <span className={cn(BAR, 'top-0', open && 'translate-y-[6px] rotate-45')} />
    <span className={cn(BAR, 'top-[6px]', open && 'opacity-0')} />
    <span className={cn(BAR, 'top-[12px]', open && '-translate-y-[6px] -rotate-45')} />
  </span>
);

export default MenuIcon;
