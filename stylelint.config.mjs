/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended-vue',
    /** 与 Prettier 对齐；`stylelint-config-prettier` 已停止维护且不支持 Stylelint 16+，故使用官方 `stylelint-prettier` */
    'stylelint-prettier/recommended',
  ],
  rules: {
    /** uni-app / 微信小程序：自定义标签与 rpx，标准 CSS 规则无法识别 */
    'selector-type-no-unknown': null,
    'declaration-property-value-no-unknown': null,
    /** BEM（如 `__title`）与 short hex 交给 Prettier / 团队习惯 */
    'selector-class-pattern': null,
    'color-hex-length': null,
  },
};
