import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  integrations: [mdx()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      // MathML only: no KaTeX CSS or fonts, and screen readers can read it.
      rehypePlugins: [[rehypeKatex, { output: 'mathml' }]],
    }),
  },
});
