import Link from 'next/link';
import { buttonVariants } from './button';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';

interface LinkButtonProps extends VariantProps<typeof buttonVariants> {
  href: string;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}

export function LinkButton({ href, variant, size, className, children, target="_self", rel="" }: LinkButtonProps) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} target={target} rel={rel}>
      {children}
    </Link>
  );
}
