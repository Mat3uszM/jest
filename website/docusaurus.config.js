/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');

const JestThemeColor = '#15c213';

// The top-30 locales on Crowdin are enabled
// but we enable only a subset of those
const locales = [
  'en',
  'ja',
  //'ar',
  //'bs-BA',
  //'ca',
  //'cs',
  //'da',
  //'de',
  //'el',
  'es-ES',
  //'fa-IR',
  //'fi',
  //'fr',
  //'he',
  //'hu',
  //'id-ID',
  //'it',
  //'af',
  //'ko',
  //'mr-IN',
  //'nl',
  //'no-NO',
  //'pl',
  //'pt-PT',
  'pt-BR',
  'ro',
  'ru',
  //'sk-SK',
  //'sr',
  //'sv-SE',
  //'tr',
  'uk',
  //'vi',
  'zh-Hans',
  //'zh-Hant',
];

const localeConfigs = {
  en: {
    label: 'English',
  },
  ja: {
    label: '日本語',
  },
  'es-ES': {
    label: 'Español',
  },
  'pt-BR': {
    label: 'Português (Brasil)',
  },
  ro: {
    label: 'Română',
  },
  ru: {
    label: 'Русский',
  },
  uk: {
    label: 'Українська',
  },
  'zh-Hans': {
    label: '简体中文',
  },
};

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales,
    localeConfigs,
  },
  title: 'Jest',
  titleDelimiter: '·',
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
          sidebarPath: './sidebars.json',
        },
        blog: {
          path: 'blog',
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: [
            path.resolve('src/components/v1/legacyCSS.css'),
            path.resolve('src/css/docusaurusTheme.scss'),
            path.resolve('src/css/algoliaDocSearchTheme.scss'),
            path.resolve('static/css/custom.scss'),
            path.resolve('static/css/jest.scss'),
          ],
        },
      },
    ],
  ],
  plugins: [
    'docusaurus-plugin-sass',
    [
      '@docusaurus/plugin-client-redirects',
      {
        // for legacy v1 Docusaurus site: /api.html => /api
        fromExtensions: ['html'],
      },
    ],
    [
      '@docusaurus/plugin-pwa',
      {
        pwaHead: [
          {
            tagName: 'link',
            rel: 'icon',
            href: 'img/jest.png',
          },
          {
            tagName: 'link',
            rel: 'manifest',
            href: `manifest.json`,
          },
          {
            tagName: 'meta',
            name: 'theme-color',
            content: JestThemeColor,
          },
          {
            tagName: 'meta',
            name: 'apple-mobile-web-app-capable',
            content: 'yes',
          },
          {
            tagName: 'meta',
            name: 'apple-mobile-web-app-status-bar-style',
            content: '#000',
          },
          {
            tagName: 'link',
            rel: 'apple-touch-icon',
            href: 'img/jest.png',
          },
          {
            tagName: 'link',
            rel: 'mask-icon',
            href: 'img/jest.svg',
            color: JestThemeColor,
          },
          {
            tagName: 'meta',
            name: 'msapplication-TileImage',
            content: 'img/jest.png',
          },
          {
            tagName: 'meta',
            name: 'msapplication-TileColor',
            content: '#000',
          },
        ],
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Jest',
      items: [
        // left items
        {
          type: 'docsVersionDropdown',
          position: 'left',
          dropdownActiveClassDisabled: true,
          dropdownItemsAfter: [
            {
              to: '/versions',
              label: 'All versions',
            },
          ],
        },
        // right items
        {
          label: 'Docs',
          type: 'doc',
          docId: 'getting-started',
          position: 'right',
        },
        {
          label: 'API',
          type: 'doc',
          docId: 'api',
          position: 'right',
        },
        {
          to: '/help',
          label: 'Help',
          position: 'right',
        },
        {to: 'blog', label: 'Blog', position: 'right'},
        {type: 'localeDropdown', position: 'right'},
        {
          href: 'https://github.com/facebook/jest',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    image: 'img/opengraph.png',
    prism: {
      theme: require('./src/prism/themeLight'),
      darkTheme: require('./src/prism/themeDark'),
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
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
