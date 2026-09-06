import { useEffect, useRef, useState } from 'react';

const number = (value) => Number.parseFloat(value) || 0;
const horizontalInsets = (style) => number(style.paddingLeft) + number(style.paddingRight)
  + number(style.borderLeftWidth) + number(style.borderRightWidth);

/** Measure the inline requirement, even when the displayed row is stacked.
 * No duplicate inputs, width mutations for measurement, or form subscriptions.
 */
export default function useSearchRowLayout(labelPlacement, hidden) {
  const rowRef = useRef(null);
  const labelRef = useRef(null);
  const contentRef = useRef(null);
  const [autoPlacement, setAutoPlacement] = useState('inline');

  useEffect(() => {
    const row = rowRef.current;
    const label = labelRef.current;
    const content = contentRef.current;
    if (labelPlacement !== 'auto' || hidden || !row || !label || !content) return undefined;

    let frame;
    let disposed = false;
    const measure = () => {
      frame = undefined;
      if (!row.getClientRects().length || row.getBoundingClientRect().width === 0) return;

      const rowStyle = getComputedStyle(row);
      const contentStyle = getComputedStyle(content);
      const items = Array.from(content.children).filter((item) => item.getClientRects().length);
      const contentWidth = items.reduce((total, item) => {
        const style = getComputedStyle(item);
        return total + item.getBoundingClientRect().width
          + number(style.marginLeft) + number(style.marginRight);
      }, 0) + Math.max(0, items.length - 1) * number(contentStyle.columnGap)
        + horizontalInsets(contentStyle);
      // The label retains its configured width in both modes; CSS controls the gap.
      const requiredWidth = label.getBoundingClientRect().width + number(rowStyle.columnGap)
        + contentWidth + horizontalInsets(rowStyle);
      const intrinsicWidth = `${Math.ceil(requiredWidth)}px`;
      if (row.style.getPropertyValue('--condition-row-intrinsic-width') !== intrinsicWidth) {
        row.style.setProperty('--condition-row-intrinsic-width', intrinsicWidth);
      }
      const availableWidth = row.getBoundingClientRect().width;
      setAutoPlacement(requiredWidth > availableWidth + 1 ? 'stacked' : 'inline');
    };
    const schedule = () => {
      if (!disposed && frame === undefined) frame = requestAnimationFrame(measure);
    };

    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    const observe = () => {
      resizeObserver?.disconnect();
      [row, label, content, ...content.children].forEach((element) => resizeObserver?.observe(element));
    };
    observe();
    // Dynamic groups, option labels, and publisher class/style changes also affect width.
    const mutationObserver = new MutationObserver((records) => {
      if (records.some((record) => record.type === 'childList')) observe();
      schedule();
    });
    mutationObserver.observe(row, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
    });
    window.addEventListener('resize', schedule);
    document.fonts?.addEventListener('loadingdone', schedule);
    schedule();

    return () => {
      disposed = true;
      if (frame !== undefined) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', schedule);
      document.fonts?.removeEventListener('loadingdone', schedule);
      row.style.removeProperty('--condition-row-intrinsic-width');
    };
  }, [labelPlacement, hidden]);

  return { rowRef, labelRef, contentRef, placement: labelPlacement === 'auto' ? autoPlacement : labelPlacement };
}
