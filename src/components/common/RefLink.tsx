import { Link, type LinkProps } from 'react-router-dom';
import { withRef } from '../../lib/referralTracking';

interface RefLinkProps extends LinkProps {
  preserveRef?: boolean;
}

export function RefLink({ to, preserveRef = true, ...props }: RefLinkProps) {
  if (!preserveRef || typeof to !== 'string') {
    return <Link to={to} {...props} />;
  }

  return <Link to={withRef(to)} {...props} />;
}
