'use client';

import { useEffect, useState } from 'react';

export default function EmailLink({ email, children }: { email: string; children: React.ReactNode }) {
  const [href, setHref] = useState(
    `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}`
  );

  useEffect(() => {
    // Touch device = mobile → mailto: opens Gmail app (or default mail app)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setHref(`mailto:${email}`);
    }
  }, [email]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="transition-all duration-200 hover:opacity-50 hover:scale-110"
    >
      {children}
    </a>
  );
}
