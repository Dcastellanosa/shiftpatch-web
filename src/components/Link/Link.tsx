import './Link.scss'
import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { navigate } from '../../lib/router/router.ts'

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string }

/** A real `<a>` (so Cmd/Ctrl/middle-click work) that navigates client-side on a plain click. */
export function Link({ to, onClick, ...props }: LinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    event.preventDefault()
    navigate(to)
  }
  return <a href={to} onClick={handleClick} {...props} />
}
