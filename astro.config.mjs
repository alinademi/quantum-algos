import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import stopLinks from './src/lib/stop-links.mjs';

export default defineConfig({
  integrations: [mdx()],
  markdown: {
    processor: unified({
      // stopLinks: links to stops not written yet go to their tile on The Map.
      remarkPlugins: [remarkMath, stopLinks],
      // MathML only: no KaTeX CSS or fonts, and screen readers can read it.
      rehypePlugins: [[rehypeKatex, { output: 'mathml' }]],
    }),
  },
});
