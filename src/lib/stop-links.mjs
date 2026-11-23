// Markdown plugin: a link to /learn/<id>/ whose stop is not written yet points to its tile on The Map instead.
// Writers always link to /learn/<id>/; links start working on their own when the stop is added.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export default function stopLinks() {
  const visit = (node) => {
    if (node.type === 'link') {
      const m = /^\/learn\/([a-z0-9-]+)\/?(#.*)?$/.exec(node.url);
      if (m && !existsSync(join(process.cwd(), 'src/content/stops', `${m[1]}.mdx`))) node.url = `/map/#${m[1]}`;
    }
    node.children?.forEach(visit);
  };
  return visit;
}
