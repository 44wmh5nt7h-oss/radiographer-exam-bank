function Button({
  as: Component = 'button',
  className = '',
  variant = 'primary',
  children,
  ...props
}) {
  const baseClassName =
    'inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2'

  const variantClassName = {
    primary: 'border border-slate-900 bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
    dark: 'border border-slate-950 bg-slate-950 text-white hover:bg-slate-800',
    ghost: 'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100',
  }[variant]

  return (
    <Component className={`${baseClassName} ${variantClassName} ${className}`.trim()} {...props}>
      {children}
    </Component>
  )
}

export default Button
