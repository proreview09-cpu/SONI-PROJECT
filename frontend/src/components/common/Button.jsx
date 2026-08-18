export default function Button({ variant = 'dark', size, children, ...rest }) {
  const cls = `btn btn-${variant}${size ? ` btn-${size}` : ''}`;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
