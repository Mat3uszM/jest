/* eslint-disable sort-keys */

const path = require('path');

module.exports = {
  title: 'Jest',
  tagline: '🃏 Delightful JavaScript Testing',
  url: 'https://jestjs.io',
  baseUrl: '/',
  projectName: 'jest',
  favicon: 'img/favicon/favicon.ico',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // homePageId: 'getting-started',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          editUrl: 'https://github.com/facebook/jest/edit/master/docs/',
          path: '../docs',
          sidebarPath: '../website/sidebars.json',
        },
        blog: {
          path: path.join(__dirname, '..', 'website', 'blog'),
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: [
            path.resolve('src/components/v1/legacyCSS.css'),
            path.resolve('src/css/customTheme.css'),
            path.resolve('static/css/custom.css'),
            path.resolve('static/css/jest.css'),
          ],
        },
      },
    ],
  ],
  plugins: ['docusaurus-plugin-sass'],
  themeConfig: {
    navbar: {
      title: 'Jest',
      logo: {
        src: 'img/jest.svg',
      },
      items: [
        {
          to: 'docs/getting-started',
          label: 'Docs',
          position: 'left',
        },
        {
          to: 'docs/api',
          label: 'API',
          position: 'left',
        },
        {to: 'blog', label: 'Blog', position: 'left'},
        {
          to: '/help',
          label: 'Help',
          position: 'left',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownItemsAfter: [
            {
              to: '/versions',
              label: 'All versions',
            },
          ],
        },
        {
          href: 'https://github.com/facebook/jest',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    image: 'img/opengraph.png',
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/',
            },
            {
              label: 'Guides',
              to: '/docs/snapshot-testing',
            },
            {
              label: 'API Reference',
              to: '/docs/api',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              to: 'https://stackoverflow.com/questions/tagged/jestjs',
            },
            {
              label: 'Reactiflux',
              to: 'https://www.reactiflux.com',
            },
            {
              label: 'Twitter',
              to: 'https://twitter.com/fbjest',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'Github',
              to: 'https://github.com/facebook/jest',
            },
            {
              label: 'Twitter',
              to: 'https://twitter.com/fbjest',
            },
          ],
        },
        {
          title: 'Legal',
          items: [
            {
              label: 'Privacy',
              href: 'https://opensource.facebook.com/legal/privacy/',
            },
            {
              label: 'Terms',
              href: 'https://opensource.facebook.com/legal/terms/',
            },
          ],
        },
      ],
      logo: {
        //         src: 'img/jest-outline.svg',
        alt: 'Facebook Open Source Logo',
        src: 'img/oss_logo.png',
        href: 'https://opensource.facebook.com',
      },
      copyright: `Copyright © ${new Date().getFullYear()} Facebook, Inc. Built with Docusaurus.`,
    },
    algolia: {
      indexName: 'jest-v2',
      apiKey: '833906d7486e4059359fa58823c4ef56',
      contextualSearch: true,
    },
    gtag: {
      trackingID: 'UA-44373548-17',
    },
  },
};
