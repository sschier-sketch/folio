import { Link, type LinkProps } from 'react-router-dom';

interface RefLinkProps extends LinkProps {
  preserveRef?: boolean;
}

export function RefLink({ to, preserveRef: _preserveRef, ...props }: RefLinkProps) {
  return <Link to={to} {...props} />;
}
