module.exports = {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-scss',
  ],
  plugins: ['stylelint-scss', 'stylelint-order'],
  customSyntax: 'postcss-sass',
  rules: {
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,

    'color-hex-length': 'short',
    'color-function-notation': 'modern',
    'scss/double-slash-comment-whitespace-inside': null,

    // Разрешаем использование подчеркивания в именах классов (BEM)
    'selector-class-pattern': [
      '^[a-z0-9__-]+$',
      {
        message:
          'Class selectors should be in lowercase with optional double underscores and hyphens',
      },
    ],

    'order/properties-order': [
      [
        'position',
        'top',
        'right',
        'bottom',
        'left',
        'z-index',
        'display',
        'flex',
        'flex-grow',
        'flex-shrink',
        'flex-basis',
        'justify-content',
        'align-items',
        'align-content',
        'width',
        'height',
        'margin',
        'padding',
        'font',
        'font-size',
        'line-height',
        'color',
        'background',
        'border',
        'box-shadow',
        'opacity',
        'transition',
        'transform',
      ],
      {
        unspecified: 'bottomAlphabetical',
      },
    ],
  },
  ignoreFiles: ['**/*.js', '**/*.ts', '**/*.html', '**/*.json'],
};
