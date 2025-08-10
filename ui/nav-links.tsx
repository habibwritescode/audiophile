import Link from 'next/link';
import React from 'react';

const options = [
  {
    name: 'Home',
    href: '/',
  },
  {
    name: 'Headphones',
    href: '/category/headphones',
  },
  {
    name: 'Speakers',
    href: '/category/speakers',
  },
  {
    name: 'Earphones',
    href: '/category/earphones',
  },
];

const NavLinks = () => {
  return (
    <nav>
      <ul className="flex flex-col items-center gap-4 md:flex-row md:gap-8.5">
        {options.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className="text-13 text-white uppercase transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default NavLinks;
