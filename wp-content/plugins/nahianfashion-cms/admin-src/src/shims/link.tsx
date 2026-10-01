import React from 'react';
import { toUrl, useRouter } from './navigation';

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean };

export default function Link({ href, onClick, prefetch: _prefetch, children, target, ...rest }: Props) {
  const router = useRouter();
  return (
    <a
      href={toUrl(href)}
      target={target}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || target === '_blank') return;
        if (/^https?:/i.test(href)) return;
        e.preventDefault();
        router.push(href);
      }}
    >
      {children}
    </a>
  );
}
