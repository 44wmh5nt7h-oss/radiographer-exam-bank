function Button({
  as: Component = 'button',
  className = '',
  variant = 'primary',
  children,
  ...props
}) {
  const baseClassName =
    'inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

  const variantClassName = {
    primary: 'border border-blue-600 bg-blue-600 text-white shadow-sm hover:border-blue-700 hover:bg-blue-700',
    secondary: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50',
    dark: 'border border-slate-900 bg-slate-900 text-white shadow-sm hover:bg-slate-800',
    ghost: 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100',
  }[variant]

  return (
    <Component className={`${baseClassName} ${variantClassName} ${className}`.trim()} {...props}>
      {children}
    </Component>
  )
}

export default Button
