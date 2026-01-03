import tippy, { type Props } from 'tippy.js';
import 'tippy.js/dist/tippy.css';

export function tooltip(node: HTMLElement, content: string | Partial<Props>) {
  const options = typeof content === 'string' ? { content } : content;
  const instance = tippy(node, {
    delay: [300, 0],
    placement: 'bottom',
    ...options
  });

  return {
    update(newContent: string | Partial<Props>) {
      const opts = typeof newContent === 'string' ? { content: newContent } : newContent;
      instance.setProps(opts);
    },
    destroy() {
      instance.destroy();
    }
  };
}
