const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'newsPage',

  exposes: {
    './routes': './src/app/app.routes.ts',
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: false,
      requiredVersion: 'auto',
    }),
  },

  // News FE không dùng ng-zorro; tránh phát sinh shared chunks dạng ng_zorro_antd_* và 404 khi load qua Shell
  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    'ng-zorro-antd/button',
    'ng-zorro-antd/icon',
    'ng-zorro-antd/message',
    'ng-zorro-antd/pagination',
    'ng-zorro-antd/select',
    'ng-zorro-antd/spin',
    'ng-zorro-antd/switch',
    'ng-zorro-antd/table',
    'ng-zorro-antd/tag',
  ],

  features: {
    ignoreUnusedDeps: true,
  },
});
