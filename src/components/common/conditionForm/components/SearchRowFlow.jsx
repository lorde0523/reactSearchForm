/** Optional layout only: form composition traverses its children transparently. */
export default function SearchRowFlow({ gap, className, style, children }) {
  return (
    <div
      className={['condition-row-flow', className].filter(Boolean).join(' ')}
      style={{
        ...(gap != null && { '--condition-flow-gap': typeof gap === 'number' ? `${gap}px` : gap }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
