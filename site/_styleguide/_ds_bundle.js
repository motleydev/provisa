/* @ds-bundle: {"format":4,"namespace":"ProvisaDesignSystem_af580e","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"TextLink","sourcePath":"components/actions/TextLink.jsx"},{"name":"FigPanel","sourcePath":"components/brand/FigPanel.jsx"},{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"BrandBars","sourcePath":"components/brand/Wordmark.jsx"},{"name":"Callout","sourcePath":"components/content/Callout.jsx"},{"name":"ChoiceCard","sourcePath":"components/content/ChoiceCard.jsx"},{"name":"Eyebrow","sourcePath":"components/content/Eyebrow.jsx"},{"name":"SectionLabel","sourcePath":"components/content/Eyebrow.jsx"},{"name":"Heading","sourcePath":"components/content/Heading.jsx"},{"name":"Emph","sourcePath":"components/content/Heading.jsx"},{"name":"RuledCard","sourcePath":"components/content/RuledCard.jsx"},{"name":"StatStrip","sourcePath":"components/content/StatStrip.jsx"},{"name":"TileCard","sourcePath":"components/content/TileCard.jsx"},{"name":"Chip","sourcePath":"components/data/Chip.jsx"},{"name":"CodeBlock","sourcePath":"components/data/CodeBlock.jsx"},{"name":"CodeTabs","sourcePath":"components/data/CodeTabs.jsx"},{"name":"ComparisonTable","sourcePath":"components/data/ComparisonTable.jsx"},{"name":"LayerRow","sourcePath":"components/data/LayerRow.jsx"},{"name":"Accordion","sourcePath":"components/disclosure/Accordion.jsx"},{"name":"DemoForm","sourcePath":"components/forms/DemoForm.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Textarea","sourcePath":"components/forms/Input.jsx"},{"name":"SubscribeField","sourcePath":"components/forms/SubscribeField.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"ToggleButtons","sourcePath":"components/forms/Switch.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"SiteFooter","sourcePath":"components/navigation/SiteFooter.jsx"},{"name":"SiteHeader","sourcePath":"components/navigation/SiteHeader.jsx"},{"name":"UtilityBar","sourcePath":"components/navigation/UtilityBar.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"4039c527b685","components/actions/TextLink.jsx":"6ff4f22adb2a","components/brand/FigPanel.jsx":"85a7fd6326f3","components/brand/Wordmark.jsx":"c586bb9d4970","components/content/Callout.jsx":"f616baf044d0","components/content/ChoiceCard.jsx":"b33b02d870d6","components/content/Eyebrow.jsx":"75d6a8e0d3a3","components/content/Heading.jsx":"dff9cc4ba84c","components/content/RuledCard.jsx":"c224c5e84c70","components/content/StatStrip.jsx":"54bd5c74888a","components/content/TileCard.jsx":"0d55ad0f2dcc","components/data/Chip.jsx":"6d27ed59b304","components/data/CodeBlock.jsx":"df6b358d9381","components/data/CodeTabs.jsx":"3783749d4214","components/data/ComparisonTable.jsx":"9aa9c023bdff","components/data/LayerRow.jsx":"5cd0c7b55dd2","components/disclosure/Accordion.jsx":"6af72959ea29","components/forms/DemoForm.jsx":"f7c72c564cf9","components/forms/Input.jsx":"1accc8710332","components/forms/SubscribeField.jsx":"1f1f4374d156","components/forms/Switch.jsx":"aad87476b7ac","components/navigation/Breadcrumb.jsx":"f0cc2de06279","components/navigation/SiteFooter.jsx":"3f414589c1f1","components/navigation/SiteHeader.jsx":"73cc96b30bec","components/navigation/UtilityBar.jsx":"875303a4ab58","ui_kits/website/ComparePage.jsx":"93c1202876b0","ui_kits/website/GovernancePage.jsx":"c4648b9c8592","ui_kits/website/HomePage.jsx":"cbde1af9d936","ui_kits/website/Shared.jsx":"d1413ced17f3"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ProvisaDesignSystem_af580e = window.ProvisaDesignSystem_af580e || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function useHover() {
  const [h, setH] = React.useState(false);
  return [h, {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false)
  }];
}
function Button({
  variant = 'primary',
  size = 'lg',
  href,
  onClick,
  children,
  block,
  type = 'button',
  style
}) {
  const [h, hp] = useHover();
  const pad = size === 'sm' ? variant === 'primary' ? '12px 20px' : '11px 19px' : variant === 'primary' || variant === 'onColor' ? '16px 26px' : '15px 25px';
  const fs = size === 'sm' ? 15 : 15.5;
  const v = {
    primary: {
      background: h ? 'var(--cobalt-hover)' : 'var(--cobalt)',
      color: '#fff',
      border: 0
    },
    secondary: {
      background: h ? 'var(--ink)' : 'transparent',
      color: h ? '#fff' : 'var(--ink)',
      border: '1px solid var(--ink)'
    },
    inverse: {
      background: h ? 'var(--ink-hover)' : 'var(--ink)',
      color: '#fff',
      border: 0
    },
    onColor: {
      background: h ? 'var(--paper)' : '#fff',
      color: 'var(--ink)',
      border: 0
    }
  }[variant];
  const s = {
    display: block ? 'flex' : 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: block ? 16 : pad,
    fontFamily: 'var(--font-sans)',
    fontSize: fs,
    fontWeight: 500,
    lineHeight: 1.2,
    cursor: 'pointer',
    textDecoration: 'none',
    borderRadius: 0,
    width: block ? '100%' : undefined,
    ...v,
    ...style
  };
  return href ? /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    onClick: onClick,
    style: s
  }, hp), children) : /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    onClick: onClick,
    style: s
  }, hp), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/TextLink.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function useHover() {
  const [h, setH] = React.useState(false);
  return [h, {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false)
  }];
}
function TextLink({
  href = '#',
  children,
  arrow,
  tone = 'forest',
  variant = 'underline',
  style
}) {
  const [h, hp] = useHover();
  const c = tone === 'inverse' ? '#fff' : tone === 'ink' ? 'var(--ink)' : 'var(--forest)';
  const base = {
    color: h && tone !== 'inverse' ? 'var(--forest)' : c,
    fontSize: 15,
    fontWeight: 500,
    textDecoration: 'none',
    ...style
  };
  const v = variant === 'underline' ? {
    borderBottom: '1px solid ' + c,
    paddingBottom: 3,
    alignSelf: 'flex-start'
  } : variant === 'inline' ? {
    textDecoration: 'underline',
    textUnderlineOffset: 4,
    fontWeight: 'inherit',
    fontSize: 'inherit'
  } : {};
  return /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    style: {
      ...base,
      ...v
    }
  }, hp), children, arrow ? ' →' : '');
}
Object.assign(__ds_scope, { TextLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/TextLink.jsx", error: String((e && e.message) || e) }); }

// components/brand/FigPanel.jsx
try { (() => {
const FIGS = {
  "platform": {
    "bg": "cobalt",
    "s": [[10, 8, 34, "sq", "vermilion"], [27, 21, 2, 48, "paper"], [27, 67, 23, 1.6, "paper"], [50, 58, 11, "sq", "paper"], [64, 58, 11, "sq", "paper"], [78, 58, 11, "sq", "paper"], [50, 69.5, 11, "sq", "paper"], [64, 69.5, 11, "sq", "paper"], [78, 69.5, 11, "sq", "paper"], [50, 81, 11, "sq", "paper"], [64, 81, 11, "sq", "paper"], [78, 81, 11, "sq", "ink"]]
  },
  "usecases": {
    "bg": "vermilion",
    "s": [[12, 18, 40, 6, "paper"], [12, 31, 88, 6, "cobalt"], [12, 44, 30, 6, "paper"], [12, 57, 55, 6, "paper"], [12, 70, 45, 6, "paper"], [12, 86, 20, 1.6, "ink"]]
  },
  "governance": {
    "bg": "cobalt",
    "rings": true
  },
  "security": {
    "bg": "forest",
    "lines": true
  },
  "interfaces": {
    "bg": "cobalt",
    "s": [[16, 12, 16, 36, "paper"], [42, 12, 16, 36, "paper"], [68, 12, 16, 36, "vermilion"], [16, 54, 68, 10, "ink"], [42, 64, 16, 24, "paper"]]
  },
  "sources": {
    "bg": "forest",
    "dots": true
  },
  "derived": {
    "bg": "vermilion",
    "s": [[12, 10, 24, "dot", "paper"], [22, 34, 1.6, 20, "ink"], [12, 74, 76, 14, "paper"], [30, 60, 58, 14, "paper"], [48, 46, 40, 14, "cobalt"], [66, 32, 22, 14, "ink"]]
  },
  "deploy": {
    "bg": "forest",
    "s": [[10, 78, 8, "sq", "paper"], [22, 66, 14, "sq", "paper"], [40, 48, 24, "sq", "cobalt"], [58, 18, 32, "sq", "vermilion"]]
  }
};
const C = n => 'var(--' + n + ')';
function shapes(f) {
  if (f.rings) return [84, 70, 56, 42, 28, 14].map((w, i) => ({
    left: (100 - w) / 2 + '%',
    top: '50%',
    width: w + '%',
    aspectRatio: '1',
    transform: 'translateY(-50%)',
    background: i === 5 ? C('vermilion') : i % 2 ? C('cobalt') : C('paper')
  }));
  if (f.lines) {
    const a = [];
    for (let i = 0; i < 12; i++) a.push({
      left: '12%',
      top: 18 + i * 6 + '%',
      width: '76%',
      height: '0.5%',
      background: C('paper'),
      opacity: .7
    });
    a.push({
      left: '12%',
      top: '53.5%',
      width: '76%',
      height: '5%',
      background: C('vermilion')
    }, {
      left: '12%',
      top: '84%',
      width: '10%',
      aspectRatio: '1',
      background: C('cobalt')
    });
    return a;
  }
  if (f.dots) {
    const hi = {
      '1,1': 'vermilion',
      '1,5': 'cobalt',
      '3,2': 'vermilion',
      '4,5': 'cobalt',
      '5,3': 'vermilion',
      '6,4': 'ink',
      '7,4': 'cobalt'
    };
    const a = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 6; c++) a.push({
      left: 10 + c * 14 + '%',
      top: 12 + r * 8.8 + '%',
      width: '8%',
      aspectRatio: '1',
      borderRadius: '50%',
      background: C(hi[r + ',' + c] || 'paper')
    });
    return a;
  }
  return f.s.map(([l, t, w, h, c]) => ({
    left: l + '%',
    top: t + '%',
    width: w + '%',
    ...(h === 'sq' ? {
      aspectRatio: '1'
    } : h === 'dot' ? {
      aspectRatio: '1',
      borderRadius: '50%'
    } : {
      height: h + '%'
    }),
    background: C(c)
  }));
}
function FigPanel({
  figure = 'platform',
  label,
  aspect = '4/5',
  style
}) {
  const f = FIGS[figure] || FIGS.platform;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: aspect,
      background: C(f.bg),
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }, shapes(f).map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: 'absolute',
      ...s
    }
  }))), label && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 16,
      left: 16,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.1em',
      color: '#fff'
    }
  }, label));
}
Object.assign(__ds_scope, { FigPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/FigPanel.jsx", error: String((e && e.message) || e) }); }

// components/brand/Wordmark.jsx
try { (() => {
function Wordmark({
  size = 26,
  inverse = false,
  bars = true,
  href,
  style
}) {
  const h = Math.round(size * 0.69),
    w = Math.round(size * 0.23);
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, bars && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: Math.max(3, Math.round(size * 0.115))
    }
  }, ['var(--cobalt)', 'var(--forest)', 'var(--vermilion)'].map(c => /*#__PURE__*/React.createElement("span", {
    key: c,
    style: {
      width: w,
      height: h,
      background: c
    }
  }))), "Provisa");
  const s = {
    fontFamily: 'var(--font-serif)',
    fontSize: size,
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    gap: Math.round(size * 0.385),
    color: inverse ? '#fff' : 'var(--ink)',
    textDecoration: 'none',
    flex: 'none',
    ...style
  };
  return href ? /*#__PURE__*/React.createElement("a", {
    href: href,
    style: s
  }, inner) : /*#__PURE__*/React.createElement("span", {
    style: s
  }, inner);
}
function BrandBars({
  width = 40,
  height = 6
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, ['var(--cobalt)', 'var(--forest)', 'var(--vermilion)'].map(c => /*#__PURE__*/React.createElement("span", {
    key: c,
    style: {
      width,
      height,
      background: c
    }
  })));
}
Object.assign(__ds_scope, { Wordmark, BrandBars });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/content/Callout.jsx
try { (() => {
function Callout({
  label = 'PLAN OUT',
  children,
  variant = 'paper',
  style
}) {
  const dark = variant === 'ink';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: dark ? '18px 24px' : '18px 20px',
      background: dark ? 'var(--ink)' : 'var(--paper)',
      color: dark ? 'var(--on-ink-1)' : 'var(--ink)',
      display: 'flex',
      gap: dark ? '14px 20px' : 16,
      flexWrap: 'wrap',
      alignItems: 'baseline',
      borderLeft: '6px solid var(--vermilion)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--vermilion)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      lineHeight: 1.5,
      flex: dark ? 1 : undefined,
      minWidth: dark ? 'min(100%,280px)' : undefined
    }
  }, children));
}
Object.assign(__ds_scope, { Callout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Callout.jsx", error: String((e && e.message) || e) }); }

// components/content/ChoiceCard.jsx
try { (() => {
function ChoiceCard({
  title,
  items = [],
  tone = 'cobalt'
}) {
  const bg = tone === 'ink' ? 'var(--sand)' : 'var(--' + tone + '-tint)';
  const c = 'var(--' + tone + ')';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      borderTop: '6px solid ' + c,
      padding: 'clamp(24px,3vw,36px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 600,
      fontSize: 28
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, items.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: '20px 1fr',
      gap: 10,
      padding: '12px 0',
      borderTop: '1px solid rgba(22,24,29,0.15)',
      fontSize: 15.5,
      lineHeight: 1.55
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      background: c,
      marginTop: 8
    }
  }), /*#__PURE__*/React.createElement("span", null, t)))));
}
Object.assign(__ds_scope, { ChoiceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/ChoiceCard.jsx", error: String((e && e.message) || e) }); }

// components/content/Eyebrow.jsx
try { (() => {
const T = {
  forest: 'var(--forest)',
  cobalt: 'var(--cobalt)',
  vermilion: 'var(--vermilion)',
  ink: 'var(--ink)',
  onForest: 'var(--forest-on-2)',
  white: '#fff'
};
function Eyebrow({
  children,
  tone = 'forest',
  size = 13,
  as = 'div',
  style
}) {
  const El = as;
  return /*#__PURE__*/React.createElement(El, {
    style: {
      fontSize: size,
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: T[tone] || tone,
      ...style
    }
  }, children);
}
function SectionLabel({
  num,
  children,
  dark
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: dark ? 'var(--forest-on-2)' : 'var(--forest)'
    }
  }, num), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase'
    }
  }, children));
}
Object.assign(__ds_scope, { Eyebrow, SectionLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/content/Heading.jsx
try { (() => {
const V = {
  hero: {
    fontSize: 'clamp(44px,6.6vw,96px)',
    lineHeight: 0.98,
    letterSpacing: '-0.03em',
    fontWeight: 600
  },
  page: {
    fontSize: 'clamp(44px,6vw,88px)',
    lineHeight: 1,
    letterSpacing: '-0.025em',
    fontWeight: 600
  },
  section: {
    fontSize: 'clamp(34px,4vw,58px)',
    lineHeight: 1.05,
    letterSpacing: '-0.025em',
    fontWeight: 600
  },
  cta: {
    fontSize: 'clamp(38px,4.6vw,66px)',
    lineHeight: 1.02,
    letterSpacing: '-0.02em',
    fontWeight: 600
  },
  sub: {
    fontSize: 'clamp(26px,2.6vw,36px)',
    lineHeight: 1.15,
    fontWeight: 600
  },
  card: {
    fontSize: 23,
    lineHeight: 1.2,
    fontWeight: 600
  },
  lede: {
    fontSize: 'clamp(20px,1.8vw,25px)',
    lineHeight: 1.45,
    fontWeight: 400
  }
};
const TAG = {
  hero: 'h1',
  page: 'h1',
  section: 'h2',
  cta: 'h2',
  sub: 'h3',
  card: 'h3',
  lede: 'p'
};
function Heading({
  level = 'section',
  as,
  children,
  color,
  style
}) {
  const El = as || TAG[level];
  return /*#__PURE__*/React.createElement(El, {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      textWrap: level === 'lede' ? 'pretty' : 'balance',
      color,
      ...V[level],
      ...style
    }
  }, children);
}
function Emph({
  children,
  color = 'var(--vermilion)'
}) {
  return /*#__PURE__*/React.createElement("em", {
    style: {
      color
    }
  }, children);
}
Object.assign(__ds_scope, { Heading, Emph });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Heading.jsx", error: String((e && e.message) || e) }); }

// components/content/RuledCard.jsx
try { (() => {
function RuledCard({
  title,
  children,
  num,
  rule = 'ink',
  weight = 1,
  titleSize = 22,
  style
}) {
  const c = {
    ink: 'var(--ink)',
    cobalt: 'var(--cobalt)',
    forest: 'var(--forest)',
    vermilion: 'var(--vermilion)',
    mint: 'var(--mint)'
  }[rule] || rule;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: num ? 10 : 12,
      borderTop: weight + 'px solid ' + c,
      paddingTop: weight > 1 ? 18 : 20,
      ...style
    }
  }, num && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--forest)'
    }
  }, num), title && /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 600,
      fontSize: titleSize
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--gray-700)'
    }
  }, children));
}
Object.assign(__ds_scope, { RuledCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/RuledCard.jsx", error: String((e && e.message) || e) }); }

// components/content/StatStrip.jsx
try { (() => {
function StatStrip({
  stats = [['3', 'languages', 'cobalt'], ['9', 'protocols', 'forest'], ['54', 'source types', 'vermilion'], ['6', 'governance layers', 'cobalt']]
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      borderTop: '1px solid var(--rule)',
      borderBottom: '1px solid var(--rule)',
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: '0 40px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))'
    }
  }, stats.map(([n, l, c], i) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      padding: i ? '40px 24px' : '40px 24px 40px 0',
      borderLeft: i ? '1px solid var(--rule)' : 0,
      display: 'flex',
      alignItems: 'baseline',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 56,
      lineHeight: 1,
      color: 'var(--' + c + ')'
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: 'var(--gray-600)'
    }
  }, l)))));
}
Object.assign(__ds_scope, { StatStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/StatStrip.jsx", error: String((e && e.message) || e) }); }

// components/content/TileCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function useHover() {
  const [h, setH] = React.useState(false);
  return [h, {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false)
  }];
}
function TileCard({
  kind = 'industry',
  title,
  body,
  eyebrow,
  num,
  color = 'cobalt',
  accent = 'vermilion',
  href = '#',
  onClick
}) {
  const [h, hp] = useHover();
  const C = n => 'var(--' + n + ')';
  if (kind === 'resource') return /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    onClick: onClick
  }, hp, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      borderTop: '1px solid var(--ink)',
      paddingTop: 18,
      color: h ? 'var(--forest)' : 'var(--ink)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--forest)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 600,
      fontSize: 24,
      lineHeight: 1.2
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '16/10',
      background: C(color),
      overflow: 'hidden',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '8%',
      bottom: 0,
      width: '22%',
      height: '58%',
      background: C(accent)
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '34%',
      bottom: 0,
      width: '22%',
      height: '34%',
      background: 'var(--paper)'
    }
  })));
  return /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    onClick: onClick
  }, hp, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      color: h ? 'var(--forest)' : 'var(--ink)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '3/4',
      background: C(color),
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: '34%',
      aspectRatio: '1',
      background: C(accent)
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 18,
      left: 18,
      fontFamily: 'var(--font-serif)',
      fontWeight: 600,
      fontSize: 56,
      lineHeight: 1,
      color: '#fff'
    }
  }, num)), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 600,
      fontSize: 25,
      lineHeight: 1.15
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 15,
      lineHeight: 1.55,
      color: 'var(--gray-700)'
    }
  }, body));
}
Object.assign(__ds_scope, { TileCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/TileCard.jsx", error: String((e && e.message) || e) }); }

// components/data/Chip.jsx
try { (() => {
function Chip({
  children,
  tone = 'sand',
  strong
}) {
  const solid = ['cobalt', 'forest', 'vermilion', 'ink'].includes(tone);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '6px 10px',
      fontSize: 13.5,
      fontWeight: solid || strong ? 600 : 500,
      background: solid ? 'var(--' + tone + ')' : 'var(--sand)',
      color: solid ? '#fff' : 'var(--ink)',
      display: 'inline-block'
    }
  }, children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Chip.jsx", error: String((e && e.message) || e) }); }

// components/data/CodeBlock.jsx
try { (() => {
function CodeBlock({
  code = '',
  lines,
  highlight = [],
  title,
  topRule,
  deep,
  style
}) {
  const L = lines || code.split('\n');
  const isC = t => /^\s*(#|--)/.test(t);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: deep ? 'var(--ink-deep)' : 'var(--ink)',
      border: deep ? '1px solid var(--ink-rule)' : 0,
      borderTop: topRule ? '6px solid var(--' + topRule + ')' : undefined,
      alignSelf: 'start',
      ...style
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 20px',
      borderBottom: '1px solid var(--ink-rule)',
      fontFamily: 'var(--font-mono)',
      fontSize: 11.5,
      color: 'var(--on-ink-label)'
    }
  }, title), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      padding: '20px 22px',
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      lineHeight: 1.8,
      overflowX: 'auto',
      color: 'var(--on-ink-code)'
    }
  }, L.map((t, i) => highlight.includes(i) ? /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: 'block',
      background: 'var(--vermilion-highlight)',
      color: '#fff',
      margin: '0 -22px',
      padding: '0 22px'
    }
  }, t || ' ') : /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      color: isC(t) ? 'var(--gray-500)' : undefined,
      whiteSpace: 'pre'
    }
  }, t || ' '))));
}
Object.assign(__ds_scope, { CodeBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/CodeBlock.jsx", error: String((e && e.message) || e) }); }

// components/data/CodeTabs.jsx
try { (() => {
function Tab({
  t,
  on,
  onClick
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      flex: 1,
      minWidth: 84,
      background: on ? 'var(--forest)' : h ? 'var(--ink-hover)' : 'transparent',
      border: 0,
      color: on || h ? '#fff' : 'var(--on-ink-tab)',
      padding: '13px 12px',
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: 'inherit',
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, t.lang), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: on ? 'var(--mint-2)' : 'var(--gray-400)'
    }
  }, t.wire));
}
function CodeTabs({
  tabs = [],
  initial = 0,
  minHeight = 290
}) {
  const [i, setI] = React.useState(initial);
  const t = tabs[i] || {
    code: []
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--ink)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      borderBottom: '1px solid var(--ink-rule)',
      overflowX: 'auto'
    }
  }, tabs.map((x, k) => /*#__PURE__*/React.createElement(Tab, {
    key: x.lang,
    t: x,
    on: k === i,
    onClick: () => setI(k)
  }))), /*#__PURE__*/React.createElement(__ds_scope.CodeBlock, {
    lines: t.code,
    style: {
      minHeight
    }
  }));
}
Object.assign(__ds_scope, { CodeTabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/CodeTabs.jsx", error: String((e && e.message) || e) }); }

// components/data/ComparisonTable.jsx
try { (() => {
function ComparisonTable({
  columns = ['Them', 'Provisa'],
  rows = [],
  highlight = 1
}) {
  const th = i => ({
    textAlign: 'left',
    padding: i === -1 ? '16px 20px 16px 0' : '16px 20px',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: i === highlight ? 'var(--forest)' : 'var(--gray-600)',
    borderBottom: '1px solid var(--ink)',
    background: i === highlight ? 'var(--forest-tint)' : undefined
  });
  const td = i => ({
    verticalAlign: 'top',
    padding: '16px 20px',
    borderBottom: '1px solid var(--rule)',
    color: i === highlight ? 'var(--ink)' : 'var(--gray-700)',
    background: i === highlight ? 'var(--forest-tint)' : undefined
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto',
      borderTop: '2px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      minWidth: 640,
      borderCollapse: 'collapse',
      fontSize: 15,
      lineHeight: 1.55
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: th(-1)
  }), columns.map((c, i) => /*#__PURE__*/React.createElement("th", {
    key: c,
    style: th(i)
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, rows.map(([k, ...v]) => /*#__PURE__*/React.createElement("tr", {
    key: k
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      verticalAlign: 'top',
      padding: '16px 20px 16px 0',
      borderBottom: '1px solid var(--rule)',
      fontWeight: 600,
      width: '22%'
    }
  }, k), v.map((x, i) => /*#__PURE__*/React.createElement("td", {
    key: i,
    style: td(i)
  }, x)))))));
}
Object.assign(__ds_scope, { ComparisonTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ComparisonTable.jsx", error: String((e && e.message) || e) }); }

// components/data/LayerRow.jsx
try { (() => {
function LayerRow({
  idx,
  title,
  tone = 'cobalt',
  href,
  onClick,
  variant = 'tint',
  desc
}) {
  const [h, setH] = React.useState(false);
  if (variant === 'list') return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '56px minmax(0,1fr) minmax(0,1.4fr)',
      gap: 16,
      padding: '20px 0',
      borderBottom: '1px solid var(--forest-rule)',
      alignItems: 'baseline',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--forest-on-2)'
    }
  }, idx), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 21
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      lineHeight: 1.5,
      color: 'var(--forest-on-1)'
    }
  }, desc));
  const c = 'var(--' + tone + ')';
  return /*#__PURE__*/React.createElement("a", {
    href: href || '#',
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'grid',
      gridTemplateColumns: '44px 1fr',
      alignItems: 'center',
      background: 'var(--' + tone + '-tint)',
      borderLeft: '6px solid ' + c,
      padding: h ? '12px 16px 12px 18px' : '12px 16px 12px 12px',
      color: 'var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: c,
      fontWeight: 500
    }
  }, idx), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500
    }
  }, title));
}
Object.assign(__ds_scope, { LayerRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/LayerRow.jsx", error: String((e && e.message) || e) }); }

// components/disclosure/Accordion.jsx
try { (() => {
function Accordion({
  items = [],
  variant = 'faq',
  initial = 0,
  onLink
}) {
  const [open, setOpen] = React.useState(initial);
  const numbered = variant === 'numbered';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      borderTop: '1px solid var(--ink)'
    }
  }, items.map((it, i) => {
    const on = open === i;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        borderBottom: '1px solid var(--rule)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setOpen(on ? -1 : i),
      style: {
        width: '100%',
        display: numbered ? 'grid' : 'flex',
        gridTemplateColumns: numbered ? '48px 1fr auto' : undefined,
        justifyContent: 'space-between',
        gap: numbered ? 16 : 24,
        alignItems: numbered ? 'baseline' : 'center',
        padding: numbered ? '26px 0' : '24px 0',
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: numbered ? 'inherit' : 'var(--font-serif)',
        color: 'var(--ink)'
      }
    }, numbered && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        color: 'var(--forest)'
      }
    }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-serif)',
        fontSize: numbered ? 'clamp(22px,2vw,28px)' : 21
      }
    }, it.title), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: numbered ? 22 : 24,
        color: 'var(--forest)',
        flex: 'none'
      }
    }, on ? '−' : '+')), on && (numbered ? /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 0 32px 64px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))',
        gap: '24px 48px'
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: 0,
        fontSize: 19,
        fontWeight: 600,
        lineHeight: 1.35
      }
    }, it.lede), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: 15.5,
        lineHeight: 1.65,
        color: 'var(--gray-700)'
      }
    }, it.body), it.link && /*#__PURE__*/React.createElement("a", {
      href: it.href || '#',
      onClick: onLink ? e => {
        e.preventDefault();
        onLink(it);
      } : undefined,
      style: {
        fontSize: 15,
        fontWeight: 500,
        color: 'var(--forest)'
      }
    }, it.link, " \u2192"))) : /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 48px 28px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: 15.5,
        lineHeight: 1.65,
        color: 'var(--gray-700)'
      }
    }, it.body), it.link && /*#__PURE__*/React.createElement("a", {
      href: it.href || '#',
      onClick: onLink ? e => {
        e.preventDefault();
        onLink(it);
      } : undefined,
      style: {
        fontSize: 15,
        fontWeight: 500,
        color: 'var(--forest)'
      }
    }, it.link, " \u2192"))));
  }));
}
Object.assign(__ds_scope, { Accordion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/disclosure/Accordion.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  placeholder,
  value,
  onChange,
  type = 'text',
  style
}) {
  return /*#__PURE__*/React.createElement("input", {
    type: type,
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    style: {
      background: '#fff',
      border: '1px solid var(--rule-input)',
      padding: '13px 14px',
      fontFamily: 'inherit',
      fontSize: 14.5,
      outline: 'none',
      borderRadius: 0,
      color: 'var(--ink)',
      minWidth: 0,
      ...style
    }
  });
}
function Textarea({
  placeholder,
  value,
  onChange,
  rows = 3,
  style
}) {
  return /*#__PURE__*/React.createElement("textarea", {
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    rows: rows,
    style: {
      background: '#fff',
      border: '1px solid var(--rule-input)',
      padding: '13px 14px',
      fontFamily: 'inherit',
      fontSize: 14.5,
      outline: 'none',
      resize: 'vertical',
      borderRadius: 0,
      color: 'var(--ink)',
      ...style
    }
  });
}
Object.assign(__ds_scope, { Input, Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/DemoForm.jsx
try { (() => {
function DemoForm({
  title = 'Book a demo',
  submitLabel = 'Book a demo',
  onSubmit
}) {
  const [sent, setSent] = React.useState(false);
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      setSent(true);
      onSubmit && onSubmit();
    },
    style: {
      background: 'var(--paper)',
      color: 'var(--ink)',
      padding: 'clamp(24px,3vw,40px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 600,
      fontSize: 28
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
      gap: 12
    }
  }, ['Full name', 'Work email', 'Company', 'Job title'].map(p => /*#__PURE__*/React.createElement(__ds_scope.Input, {
    key: p,
    placeholder: p
  }))), /*#__PURE__*/React.createElement(__ds_scope.Textarea, {
    placeholder: "What would you like to connect?"
  }), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    block: true,
    type: "submit"
  }, sent ? 'Thanks — we’ll be in touch' : submitLabel));
}
Object.assign(__ds_scope, { DemoForm });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/DemoForm.jsx", error: String((e && e.message) || e) }); }

// components/forms/SubscribeField.jsx
try { (() => {
function SubscribeField({
  placeholder = 'Work email',
  label = 'Subscribe'
}) {
  const [done, setDone] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      border: '1px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: placeholder,
    style: {
      flex: 1,
      minWidth: 0,
      background: 'transparent',
      border: 0,
      padding: '11px 12px',
      fontFamily: 'inherit',
      fontSize: 13.5,
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDone(true),
    style: {
      background: 'var(--ink)',
      color: '#fff',
      border: 0,
      padding: '0 14px',
      fontFamily: 'inherit',
      fontSize: 13,
      cursor: 'pointer'
    }
  }, done ? 'Subscribed' : label));
}
Object.assign(__ds_scope, { SubscribeField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SubscribeField.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  on,
  onChange,
  label,
  showState = true
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: onChange ? 'pointer' : 'default'
    },
    onClick: () => onChange && onChange(!on)
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13
    }
  }, label), showState && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      fontWeight: 500
    }
  }, on ? 'on' : 'off'), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 24,
      borderRadius: 12,
      background: on ? 'var(--forest)' : 'var(--switch-off)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 3,
      left: on ? 23 : 3,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: '#fff',
      transition: 'left .2s'
    }
  })));
}
function ToggleButtons({
  options = [],
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, options.map(o => {
    const on = o === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o,
      onClick: () => onChange && onChange(o),
      style: {
        background: on ? 'var(--ink)' : 'transparent',
        color: on ? '#fff' : 'var(--ink)',
        border: '1px solid ' + (on ? 'var(--ink)' : 'var(--rule-input)'),
        padding: '10px 16px',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer'
      }
    }, o);
  }));
}
Object.assign(__ds_scope, { Switch, ToggleButtons });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
function Breadcrumb({
  items = [['Provisa', '#']],
  current
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--gray-600)',
      display: 'flex',
      gap: 10
    }
  }, items.map(([t, h]) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: t
  }, /*#__PURE__*/React.createElement("a", {
    href: h,
    style: {
      color: 'var(--gray-600)'
    }
  }, t), /*#__PURE__*/React.createElement("span", null, "/"))), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink)'
    }
  }, current));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SiteFooter.jsx
try { (() => {
const DEF = [['Platform', ['Active Semantic Layer', 'Interfaces', 'Governance', 'Sources', 'Materialized views', 'Catalog', 'No lock-in']], ['Compare', ['vs Starburst', 'vs Denodo', 'Coming from Hasura']], ['Get started', ['Docs', 'Register (free license)', 'Support', 'Book a demo']]];
function SiteFooter({
  blurb = 'The Active Semantic Layer. Business Source License 1.1 — non-production use (including evaluation) is free forever, for any size organization.',
  columns = DEF,
  onLink
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--paper)',
      borderTop: '1px solid var(--rule)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: '72px 40px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: 56
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1/-1',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      maxWidth: 700
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    bars: false
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      lineHeight: 1.65,
      color: 'var(--gray-600)'
    }
  }, blurb)), columns.map(([h, links]) => /*#__PURE__*/React.createElement("div", {
    key: h,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      marginBottom: 4
    }
  }, h), links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    onClick: onLink ? e => {
      e.preventDefault();
      onLink(l);
    } : undefined
  }, l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      marginBottom: 4
    }
  }, "Keep me posted"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      lineHeight: 1.5,
      color: 'var(--gray-600)'
    }
  }, "Want the release notes? Get new features and platform updates by email."), /*#__PURE__*/React.createElement(__ds_scope.SubscribeField, null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--gray-600)'
    }
  }, "Product updates only. No spam, unsubscribe anytime."))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--rule)',
      paddingTop: 24,
      display: 'flex',
      justifyContent: 'space-between',
      gap: 24,
      flexWrap: 'wrap',
      fontSize: 13,
      color: 'var(--gray-600)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 Provisa"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Privacy"), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Terms")))));
}
Object.assign(__ds_scope, { SiteFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SiteFooter.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SiteHeader.jsx
try { (() => {
function SiteHeader({
  items = ['Platform', 'Governance', 'Industries', 'Interfaces', 'Sources', 'Insights', 'Compare'],
  active,
  onNavigate,
  homeHref = '#top',
  secondaryLabel = 'Start free trial',
  secondaryHref = 'https://cloud.provisa.dev',
  ctaLabel = 'Book a demo',
  ctaHref = '#contact',
  sticky = true
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: sticky ? 'sticky' : 'relative',
      top: 0,
      zIndex: 20,
      background: 'rgba(248,246,241,0.96)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--rule)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: '0 40px',
      height: 76,
      display: 'flex',
      alignItems: 'center',
      gap: 48
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    href: homeHref
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      columnGap: 32,
      rowGap: 40,
      fontSize: 15,
      flex: 1,
      minWidth: 0,
      flexWrap: 'wrap',
      height: 76,
      overflow: 'hidden',
      alignItems: 'center',
      alignContent: 'flex-start',
      paddingTop: 27,
      whiteSpace: 'nowrap'
    }
  }, items.map(it => {
    const label = typeof it === 'string' ? it : it.label;
    const on = label === active;
    return /*#__PURE__*/React.createElement("a", {
      key: label,
      href: it.href || '#' + label.toLowerCase(),
      onClick: onNavigate ? e => {
        e.preventDefault();
        onNavigate(label);
      } : undefined,
      style: on ? {
        color: 'var(--forest)',
        fontWeight: 600
      } : undefined
    }, label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      flex: 'none',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: secondaryHref,
    style: {
      fontSize: 15,
      fontWeight: 500
    }
  }, secondaryLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    href: ctaHref
  }, ctaLabel))));
}
Object.assign(__ds_scope, { SiteHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SiteHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/UtilityBar.jsx
try { (() => {
function UtilityBar({
  message = 'The hosted service is live — ',
  linkText = 'start a free trial today',
  linkHref = 'https://cloud.provisa.dev',
  links = [['Docs', 'https://provisa.dev/docs'], ['Support', '#contact'], ['Register (free license)', 'https://provisa.dev/register']]
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--cobalt)',
      color: 'var(--cobalt-on-2)',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: '9px 40px',
      display: 'flex',
      gap: 24,
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", null, message, /*#__PURE__*/React.createElement("a", {
    href: linkHref,
    style: {
      color: '#fff',
      textDecoration: 'underline',
      textUnderlineOffset: 3
    }
  }, linkText)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 22
    }
  }, links.map(([t, h]) => /*#__PURE__*/React.createElement("a", {
    key: t,
    href: h,
    style: {
      color: 'var(--cobalt-on-2)'
    }
  }, t)))));
}
Object.assign(__ds_scope, { UtilityBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/UtilityBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/ComparePage.jsx
try { (() => {
const CMP_ROWS = [['What it is', 'A query engine and lakehouse platform', 'A semantic and governance layer over an engine you choose'], ['Query languages', 'SQL', 'SQL, GraphQL, and Cypher over one model'], ['Ways in', 'JDBC/ODBC, REST, client drivers', 'pgwire, Bolt, Arrow Flight, gRPC, JDBC, REST, WebSocket, Airport, MCP'], ['Writes', 'Analytical, engine-mediated', 'Transactional writes routed direct to the driver, under 100ms'], ['The engine', 'Is the product', 'Is a swappable component: Trino, Starburst, DuckDB, ClickHouse, Postgres, Snowflake, Databricks, BigQuery'], ['Smallest deployment', 'A cloud service or a cluster', /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("code", {
  style: {
    background: 'var(--sand)',
    padding: '1px 5px'
  }
}, "pip install \"provisa[embedded]\""), ". No Docker, no JVM, no root.")]];
function ComparePage({
  go
}) {
  const two = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))',
    gap: '48px 72px',
    alignItems: 'start'
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: 'clamp(40px,5vw,64px) 40px clamp(56px,7vw,96px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(40px,5vw,64px)'
    }
  }, /*#__PURE__*/React.createElement(DS.Breadcrumb, {
    items: [['Provisa', '#']],
    current: "vs Starburst"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,460px),1fr))',
      gap: 56,
      alignItems: 'end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement(DS.Eyebrow, {
    tone: "cobalt"
  }, "Provisa and Starburst"), /*#__PURE__*/React.createElement(DS.Heading, {
    level: "page",
    style: {
      fontSize: 'clamp(44px,6vw,88px)'
    }
  }, "Provisa and Starburst solve different halves."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'clamp(18px,1.5vw,21px)',
      lineHeight: 1.55,
      margin: 0,
      maxWidth: 620
    }
  }, "Starburst is a Trino-based query engine and lakehouse platform. Provisa is a governed semantic layer that sits above an engine, and that engine can be Starburst. The useful question is which layer you're missing."), /*#__PURE__*/React.createElement(HeroCTAs, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--cobalt)',
      color: '#fff',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--cobalt-on-3)'
    }
  }, "PROVISA \xB7 SEMANTIC + GOVERNANCE LAYER"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      lineHeight: 1.5
    }
  }, "SQL, GraphQL, Cypher \xB7 nine protocols \xB7 six governance layers \xB7 MCP")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--gray-600)'
    }
  }, "\u2193"), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--ink)',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--gray-600)'
    }
  }, "EXECUTION ENGINE \xB7 YOUR CHOICE"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(DS.Chip, {
    tone: "ink"
  }, "Starburst"), ['Trino', 'DuckDB', 'ClickHouse', 'Postgres', 'Snowflake', 'Databricks', 'BigQuery'].map(e => /*#__PURE__*/React.createElement(DS.Chip, {
    key: e
  }, e))))))), /*#__PURE__*/React.createElement(Sec, {
    band: "white",
    inner: {
      padding: 'clamp(72px,9vw,128px) 40px',
      ...two
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(DS.Eyebrow, null, "Where they overlap"), /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section",
    style: {
      fontSize: 'clamp(34px,4vw,54px)'
    }
  }, "Both federate without moving the data")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(P, null, "Both query heterogeneous sources in place, and both make the case against copying everything into one warehouse first."), /*#__PURE__*/React.createElement(DS.Heading, {
    level: "lede",
    style: {
      fontSize: 'clamp(19px,1.6vw,23px)'
    }
  }, "If your problem is SQL analytics over many systems at scale, Starburst solves it well, and Provisa is happy to use it as the execution engine."))), /*#__PURE__*/React.createElement(Sec, {
    inner: {
      padding: 'clamp(72px,9vw,128px) 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: two
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(DS.Eyebrow, {
    tone: "cobalt"
  }, "Where they differ"), /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section",
    style: {
      fontSize: 'clamp(34px,4vw,54px)'
    }
  }, "Side by side")), /*#__PURE__*/React.createElement(P, null, "One is an engine. The other is the layer that describes, governs, and serves data on top of one.")), /*#__PURE__*/React.createElement(DS.ComparisonTable, {
    columns: ['Starburst', 'Provisa'],
    rows: CMP_ROWS,
    highlight: 1
  })), /*#__PURE__*/React.createElement(Sec, {
    inner: {
      padding: '0 40px clamp(72px,9vw,128px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: two
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(DS.Eyebrow, {
    tone: "vermilion"
  }, "Choosing"), /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section",
    style: {
      fontSize: 'clamp(34px,4vw,54px)'
    }
  }, "When one of them is enough")), /*#__PURE__*/React.createElement(P, null, "Plenty of teams need only one. These are the honest cases for each.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(DS.ChoiceCard, {
    title: "Choose Provisa alone when",
    items: ['You need GraphQL or Cypher, not only SQL.', 'You have transactional and application traffic, not just analytics.', 'Governance must hold identically across every API and protocol, agents included.', 'You need to run airgapped from a wheel, or on a laptop, without a cluster.']
  }), /*#__PURE__*/React.createElement(DS.ChoiceCard, {
    tone: "ink",
    title: "Choose Starburst alone when",
    items: ['Your workload is large-scale SQL analytics and nothing else.', 'You want a managed lakehouse with its own storage architecture and support contract.', 'Engine-level access control meets your governance needs.']
  }))), /*#__PURE__*/React.createElement(ContactBand, {
    tone: "ink",
    title: "Describe your data and govern it in the same act.",
    sub: "One governed path for analytical, application, and human data movement."
  }));
}
window.ComparePage = ComparePage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/ComparePage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/GovernancePage.jsx
try { (() => {
const GOV_G = [{
  name: 'Who can see',
  range: '0 – 2',
  tone: 'cobalt'
}, {
  name: 'What they get',
  range: '3 – 4',
  tone: 'forest'
}, {
  name: 'Whether it runs',
  range: '5',
  tone: 'vermilion'
}];
const GOV_L = [[0, 'Introspection filtering', 'Schema browsers only ever see what the role is allowed to see. A hidden table is not a table the user can discover and then be denied; it is absent from the catalog they are handed.'], [0, 'Public access', 'The anonymous surface is declared explicitly. Nothing becomes publicly readable as a side effect of registering it.'], [0, 'Domain access', 'Roles reach only the domains registered to them. Domains are the coarse boundary the finer layers operate inside.'], [1, 'Row-level security', 'Per-table, per-role WHERE injection, inherited recursively — a view over a governed table carries the predicate of everything beneath it.'], [1, 'Column visibility and masking', 'Columns are visible, hidden, or masked per role. Masking is regex, constant, or truncation, with an explicit role-based bypass.'], [2, 'Predicate guard and approval', 'A pre-execution ABAC hook over webhook, gRPC, or unix socket. The plan is offered to your own decision service before it runs.']];
function GovernancePage({
  go
}) {
  const [role, setRole] = React.useState('Analyst');
  const on = role !== 'Trusted role';
  const rows = [['JOINs and traversals', on ? 'registered relationships only' : 'unconstrained', on ? 'forest' : 'vermilion'], ['Row-level security', 'applied', 'forest'], ['Column masking', 'applied', 'forest'], ['Audit row', 'written', 'forest']];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: 'clamp(40px,5vw,64px) 40px clamp(56px,7vw,96px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(40px,5vw,64px)'
    }
  }, /*#__PURE__*/React.createElement(DS.Breadcrumb, {
    items: [['Provisa', '#']],
    current: "Governance"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,460px),1fr))',
      gap: 56,
      alignItems: 'end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement(DS.Eyebrow, null, "Active, query-time governance"), /*#__PURE__*/React.createElement(DS.Heading, {
    level: "page"
  }, "Six layers, compiled into the plan."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'clamp(18px,1.5vw,21px)',
      lineHeight: 1.55,
      margin: 0,
      maxWidth: 620
    }
  }, "Governance is applied at query time, uniformly, on every language and every transport. Add a source, a column, or a relationship and every layer applies automatically \u2014 there is nothing to remember and nothing to re-apply per API."), /*#__PURE__*/React.createElement(HeroCTAs, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      border: '1px solid var(--ink)',
      fontFamily: 'var(--font-mono)',
      fontSize: 12.5
    }
  }, "GraphQL \xB7 SQL \xB7 Cypher  \u2192  any of nine protocols"), GOV_L.map(([g, t], i) => /*#__PURE__*/React.createElement(DS.LayerRow, {
    key: t,
    idx: String(i),
    title: t,
    tone: GOV_G[g].tone
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      background: 'var(--ink)',
      color: '#fff',
      fontSize: 14,
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12.5,
      color: 'var(--vermilion-on-dark)'
    }
  }, "PLAN OUT"), "One compiled plan, policy already inside it \u2014 plus the audit row")))), /*#__PURE__*/React.createElement(Sec, {
    band: "white",
    inner: {
      padding: 'clamp(72px,9vw,128px) 40px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))',
      gap: '48px 64px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      alignSelf: 'start',
      position: 'sticky',
      top: 110
    }
  }, /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section",
    style: {
      fontSize: 'clamp(34px,4vw,54px)'
    }
  }, "The layers"), GOV_G.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.name,
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      fontSize: 14.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 14,
      background: 'var(--' + g.tone + ')'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, g.name), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gray-600)',
      fontFamily: 'var(--font-mono)',
      fontSize: 12.5
    }
  }, g.range)))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 2',
      minWidth: 'min(100%,600px)',
      borderTop: '1px solid var(--ink)'
    }
  }, GOV_L.map(([g, t, b], i) => {
    const c = 'var(--' + GOV_G[g].tone + ')';
    return /*#__PURE__*/React.createElement("div", {
      key: t,
      style: {
        display: 'grid',
        gridTemplateColumns: 'minmax(80px,120px) 1fr',
        gap: 24,
        padding: '36px 0',
        borderBottom: '1px solid var(--rule)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(56px,6vw,88px)',
        lineHeight: 0.85,
        color: c
      }
    }, i), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(DS.Eyebrow, {
      size: 12,
      tone: c
    }, GOV_G[g].name), /*#__PURE__*/React.createElement(DS.Heading, {
      level: "sub",
      style: {
        lineHeight: 1.1
      }
    }, t), /*#__PURE__*/React.createElement(P, {
      style: {
        maxWidth: 720
      }
    }, b)));
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--forest)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: 'clamp(72px,9vw,128px) 40px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,460px),1fr))',
      gap: 56,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(DS.Eyebrow, {
    tone: "onForest"
  }, "Per-role capability"), /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section",
    style: {
      fontSize: 'clamp(34px,4vw,54px)'
    }
  }, "It's a per-role capability"), /*#__PURE__*/React.createElement(P, {
    c: "var(--forest-on-1)"
  }, "The guardrail is a single flag on the role. Leave it on for analysts and agents who should stay on the rails; take the training wheels off for a trusted role and it writes unconstrained JOINs across the whole federated model.")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper)',
      color: 'var(--ink)',
      padding: 'clamp(24px,3vw,36px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement(DS.ToggleButtons, {
    options: ['Analyst', 'AI agent', 'Trusted role'],
    value: role,
    onChange: setRole
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
      padding: '16px 0',
      borderTop: '1px solid var(--ink)',
      borderBottom: '1px solid var(--rule)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13
    }
  }, "relationship_guard"), /*#__PURE__*/React.createElement(DS.Switch, {
    on: on
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, rows.map(([k, v, c]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 16,
      fontSize: 14.5
    }
  }, /*#__PURE__*/React.createElement("span", null, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--' + c + ')'
    }
  }, v))))))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: 'clamp(72px,9vw,128px) 40px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,460px),1fr))',
      gap: 56,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(DS.Eyebrow, {
    tone: "vermilion"
  }, "Audit"), /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section",
    style: {
      fontSize: 'clamp(34px,4vw,54px)'
    }
  }, "Observability as data"), /*#__PURE__*/React.createElement(P, null, "Traces, metrics, and logs are collected via OpenTelemetry, compacted into Iceberg, and registered as queryable tables. The audit trail is a governed table like any other, not a log file you grep.")), /*#__PURE__*/React.createElement(DS.CodeBlock, {
    title: "psql \xB7 port 5439",
    topRule: "vermilion",
    code: "-- The audit trail is a governed table\nSELECT c.name, q.language, q.protocol,\n       q.duration_ms, q.started_at\nFROM customers c\nJOIN queries q ON q.actor = c.email\nWHERE q.started_at > now() - interval '1 day'\nORDER BY q.duration_ms DESC;"
  })), /*#__PURE__*/React.createElement(ContactBand, {
    tone: "ink",
    title: "Describe your data and govern it in the same act.",
    sub: "One governed path for analytical, application, and human data movement."
  }));
}
window.GovernancePage = GovernancePage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/GovernancePage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/HomePage.jsx
try { (() => {
const TABS = [{
  lang: 'SQL',
  wire: 'pgwire',
  code: ['# psql speaks to Provisa as if it were Postgres — on port 5439', 'psql -h localhost -p 5439 -U analyst', '', '# One SQL query, joined across Postgres, Mongo, and Elasticsearch', 'SELECT c.name, o.total, t.trace_id', 'FROM customers c', 'JOIN orders o   ON o.customer_id = c.id', 'JOIN queries t  ON t.actor = c.email', 'WHERE o.total > 1000;']
}, {
  lang: 'GraphQL',
  wire: 'HTTP',
  code: ['# The same query against the per-role GraphQL schema', 'POST /graphql', '', 'query {', '  customers(where: { orders: { total: { _gt: 1000 } } }) {', '    name', '    orders { total }', '    queries { trace_id }', '  }', '}']
}, {
  lang: 'Cypher',
  wire: 'Bolt',
  code: ['# Neo4j Browser and drivers over the federated graph', 'cypher-shell -a bolt://localhost:7687', '', 'MATCH (c:Customer)-[:PLACED]->(o:Order)', 'MATCH (c)-[:RAN]->(t:Query)', 'WHERE o.total > 1000', 'RETURN c.name, o.total, t.trace_id;']
}, {
  lang: 'REST',
  wire: 'OpenAPI',
  code: ['# Generated REST — JSON:API 1.1', 'GET /api/customers', '    ?filter[orders.total][gt]=1000', '    &include=orders,queries', '    &fields[customers]=name']
}, {
  lang: 'gRPC',
  wire: 'HTTP/2',
  code: ['# A .proto generated from your schema', 'grpcurl -plaintext localhost:50051 \\', '  provisa.Customers/Query', '', '{ "where": { "orders.total": { "gt": 1000 } },', '  "select": ["name", "orders.total"] }']
}];
const UC = [{
  title: 'Give an agent your data',
  lede: 'An AI agent needs one database, safely.',
  body: 'Point Claude or any MCP client at Provisa instead of the database. The OAuth token maps to a role, so the agent gets the same six governance layers a person does — and no bypass to forget about.',
  link: 'MCP, and the eight other protocols',
  go: 'Governance'
}, {
  title: 'A backend for your frontend',
  lede: "One API over sources that don't match.",
  body: 'The app needs Postgres, a document store, and two internal REST services in the same response. Declare the relationships once and the API spans all of them.',
  link: 'The interfaces, and the Hasura path in'
}, {
  title: 'BI without a warehouse',
  lede: 'Tableau over the sources you actually have.',
  body: 'Postgres, Mongo, Elasticsearch, a Google Sheet, an S3 prefix of extracts. Connect the BI tool over JDBC or pgwire and join across all of them — no pipeline, no copy, no warehouse in the middle.',
  link: 'All 54 source types'
}, {
  title: 'Data science, connected',
  lede: 'Every dataset the team needs, in Arrow.',
  body: 'Register the sources once and the whole team queries them from pandas, Polars, or DuckDB.',
  link: 'Flight, Airport, and pgwire'
}];
const LAYERS = [['Introspection filtering', 'Schema browsers only ever see what the role is allowed to see.'], ['Public access', 'Anonymous surface is explicit, never accidental.'], ['Domain access', 'Roles reach only the domains registered to them.'], ['Row-level security', 'Per-table, per-role WHERE injection — inherited recursively.'], ['Column visibility & masking', 'Regex, constant, or truncate masking with role-based bypass.'], ['Predicate guard & approval', 'Pre-execution ABAC hook over webhook, gRPC, or unix socket.']];
const FAQ = [{
  title: 'Is Provisa a database, or does it replace my warehouse?',
  body: 'Neither. Provisa is a semantic and governance layer that runs on an engine you choose — Trino, DuckDB, ClickHouse, Postgres, Snowflake, Databricks, BigQuery, or the embedded Trino-compatible engine in the box.',
  link: 'Why that matters'
}, {
  title: 'How is this different from Starburst or Denodo?',
  body: 'Starburst is a query engine; Provisa sits above one and can use Starburst as its engine.',
  link: 'Provisa and Starburst',
  go: 'Compare'
}, {
  title: 'Can AI agents query my data safely?',
  body: 'An MCP server exposes governed tables as tools. The OAuth token maps to a role, so every agent call passes the same six governance layers as a human query.',
  link: 'How governance applies',
  go: 'Governance'
}, {
  title: 'Does it work in an airgap?',
  body: "The embedded profile ships the entire runnable system, precompiled UI included, as a single Python wheel. There's no Docker registry to mirror, no JVM, and no root required."
}];
const SOURCES = ['PostgreSQL', 'MySQL', 'MongoDB', 'Cassandra', 'Elasticsearch', 'Neo4j', 'SPARQL', 'Kafka', 'Snowflake', 'Databricks', 'BigQuery', 'Fabric', 'ClickHouse', 'DuckDB', 'Google Sheets', 'CSV / Parquet', 'SharePoint', 'Splunk', 'S3 · FTP · SFTP', 'REST APIs'];
function HomePage({
  go
}) {
  const link = it => it.go && go(it.go);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: 'clamp(56px,8vw,112px) 40px clamp(56px,7vw,96px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(40px,5vw,72px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      maxWidth: 1100
    }
  }, /*#__PURE__*/React.createElement(DS.Eyebrow, null, "A semantic layer. Not another platform."), /*#__PURE__*/React.createElement(DS.Heading, {
    level: "hero"
  }, "Query the data you already have. ", /*#__PURE__*/React.createElement(DS.Emph, null, "Replace nothing."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
      gap: 56,
      borderTop: '1px solid var(--ink)',
      paddingTop: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'clamp(18px,1.5vw,21px)',
      lineHeight: 1.55,
      margin: 0,
      textWrap: 'pretty'
    }
  }, "Provisa sits on top of the databases, warehouses, and files you already run. Connect them once, then query in ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 600
    }
  }, "SQL, GraphQL, or Cypher"), " from psql, Tableau, Neo4j Browser, or an AI agent. Access rules are compiled into every query, so there's no way around them. Running on your laptop in about five minutes."), /*#__PURE__*/React.createElement(HeroCTAs, null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      color: 'var(--gray-600)'
    }
  }, "No sales cycle required: ", /*#__PURE__*/React.createElement(DS.TextLink, {
    variant: "inline",
    tone: "ink"
  }, "pip install it"), " or ", /*#__PURE__*/React.createElement(DS.TextLink, {
    variant: "inline",
    tone: "ink"
  }, "try it on your data"), " in the browser.")), /*#__PURE__*/React.createElement(DS.CodeTabs, {
    tabs: TABS
  }))), /*#__PURE__*/React.createElement(DS.StatStrip, null), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: 'clamp(72px,9vw,120px) 40px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section",
    style: {
      maxWidth: 900
    }
  }, "It does one job, and stays out of the way of everything else."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement(DS.RuledCard, {
    rule: "cobalt",
    weight: 4,
    titleSize: 23,
    title: "Not a warehouse"
  }, "Your data stays where it is. No pipeline, no copy, nothing to migrate."), /*#__PURE__*/React.createElement(DS.RuledCard, {
    rule: "forest",
    weight: 4,
    titleSize: 23,
    title: "Not a query engine"
  }, "It runs on the engine you choose \u2014 Trino, DuckDB, Snowflake, Databricks, Postgres \u2014 or the one in the box."), /*#__PURE__*/React.createElement(DS.RuledCard, {
    rule: "vermilion",
    weight: 4,
    titleSize: 23,
    title: "Not a rollout"
  }, "One ", /*#__PURE__*/React.createElement("code", null, "pip install"), ". No Docker, no JVM, no cluster to start. Scale out later with Helm or Terraform."), /*#__PURE__*/React.createElement(DS.RuledCard, {
    rule: "ink",
    weight: 4,
    titleSize: 23,
    title: "Not a lock-in"
  }, "Your model is plain config in git. The SQL it compiles is yours to read and keep."))), /*#__PURE__*/React.createElement(Sec, null, /*#__PURE__*/React.createElement(RailGrid, {
    num: "01",
    label: "Platform",
    figure: "platform"
  }, /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section"
  }, "Describe your data once. The rest is generated."), /*#__PURE__*/React.createElement(DS.Heading, {
    level: "lede"
  }, "You describe your data once \u2014 sources, tables, relationships, who may see what. Everything else is generated from that one description: the APIs, the legal join paths, the governance, and the audit trail. ", /*#__PURE__*/React.createElement("em", null, "There is no second place to keep in sync.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))',
      gap: 40,
      paddingTop: 16
    }
  }, /*#__PURE__*/React.createElement(DS.RuledCard, {
    title: "Three languages, one model"
  }, "GraphQL, Cypher, and SQL all query the same federated model and retarget to any source dialect."), /*#__PURE__*/React.createElement(DS.RuledCard, {
    title: "Read and write"
  }, "Analytical and transactional flows through the same governed API."), /*#__PURE__*/React.createElement(DS.RuledCard, {
    title: "Smart routing"
  }, "Single-source queries bypass federation entirely.")))), /*#__PURE__*/React.createElement(Sec, {
    band: "white"
  }, /*#__PURE__*/React.createElement(RailGrid, {
    num: "02",
    label: "Use cases",
    figure: "usecases"
  }, /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section"
  }, "Start with one problem. Most teams do."), /*#__PURE__*/React.createElement(DS.Accordion, {
    variant: "numbered",
    items: UC,
    onLink: link
  }))), /*#__PURE__*/React.createElement(Sec, {
    band: "forest"
  }, /*#__PURE__*/React.createElement(RailGrid, {
    num: "03",
    label: "Active, query-time governance",
    figure: "governance",
    dark: true
  }, /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section"
  }, "Governance you set once and can\u2019t forget."), /*#__PURE__*/React.createElement(P, {
    c: "var(--forest-on-1)",
    s: 16
  }, "All six are applied while the query is ", /*#__PURE__*/React.createElement("em", null, "compiled"), ", not checked against a policy list afterwards. What executes is already the governed query \u2014 so there is no version of it that could have run ungoverned."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      borderTop: '1px solid var(--forest-rule-strong)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 0',
      borderBottom: '1px solid var(--forest-rule)',
      fontSize: 14,
      color: 'var(--forest-on-2)',
      fontFamily: 'var(--font-mono)'
    }
  }, "Query in GraphQL \xB7 SQL \xB7 Cypher, over any of the nine protocols"), LAYERS.map(([t, d], i) => /*#__PURE__*/React.createElement(DS.LayerRow, {
    key: t,
    variant: "list",
    idx: '0' + i,
    title: t,
    desc: d
  })), /*#__PURE__*/React.createElement(DS.Callout, {
    style: {
      marginTop: 12
    }
  }, "One compiled plan, policy already inside it \u2014 plus the audit row")), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('Governance');
    },
    style: {
      color: '#fff',
      fontSize: 15,
      fontWeight: 500,
      borderBottom: '1px solid #fff',
      paddingBottom: 3,
      alignSelf: 'flex-start'
    }
  }, "How each layer works \u2192"))), /*#__PURE__*/React.createElement(Sec, {
    band: "white",
    inner: {
      display: 'flex',
      flexDirection: 'column',
      gap: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 32,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section"
  }, "Built for teams that answer to auditors."), /*#__PURE__*/React.createElement(DS.TextLink, null, "Talk to an industry specialist")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement(DS.TileCard, {
    num: "01",
    title: "Financial services",
    body: "Row-level security, masking, and an audit row on every query an auditor asks about.",
    color: "cobalt",
    accent: "vermilion"
  }), /*#__PURE__*/React.createElement(DS.TileCard, {
    num: "02",
    title: "Healthcare & life sciences",
    body: "Column masking with role-based bypass over clinical and research sources \u2014 no copies to govern.",
    color: "forest",
    accent: "cobalt"
  }), /*#__PURE__*/React.createElement(DS.TileCard, {
    num: "03",
    title: "Public sector",
    body: "Airgap-ready from an Artifactory PyPI mirror. No new supply chain to approve.",
    color: "vermilion",
    accent: "forest"
  }), /*#__PURE__*/React.createElement(DS.TileCard, {
    num: "04",
    title: "Manufacturing & energy",
    body: "Crawl the shared drives and SharePoint sites plants run on, and catalog every table in them.",
    color: "ink",
    accent: "vermilion"
  }))), /*#__PURE__*/React.createElement(Sec, null, /*#__PURE__*/React.createElement(RailGrid, {
    num: "06",
    label: "Data sources",
    figure: "sources"
  }, /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section"
  }, "54 source types. No pipelines."), /*#__PURE__*/React.createElement(P, null, "Graph and RDF sources are first-class, not adapters. Register REST, GraphQL, gRPC, WebSocket, or RSS endpoints as governed tables \u2014 federated joins across API and relational sources work transparently."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))',
      borderTop: '1px solid var(--ink)'
    }
  }, SOURCES.map(s => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      padding: '14px 0',
      borderBottom: '1px solid var(--rule)',
      fontSize: 15
    }
  }, s))), /*#__PURE__*/React.createElement(DS.TextLink, null, "See all 54 source types"))), /*#__PURE__*/React.createElement(Sec, {
    band: "ink"
  }, /*#__PURE__*/React.createElement(RailGrid, {
    num: "08",
    label: "Enterprise-ready",
    figure: "deploy"
  }, /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section"
  }, "Airgap-ready. Install from PyPI."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement(P, {
    c: "var(--on-ink-2)",
    s: 16
  }, "The embedded profile ships the entire runnable system \u2014 precompiled UI and all \u2014 as a single Python wheel. Regulated and airgapped orgs already trust Artifactory-as-PyPI, so there's no new supply chain to approve."), /*#__PURE__*/React.createElement(DS.CodeBlock, {
    deep: true,
    code: '# One wheel. Everything inside.\npip install "provisa[embedded]"\nprovisa run\n\n# Federate against your own engine when you want scale-out\nexport TRINO_HOST=trino.internal\nprovisa run'
  })))), /*#__PURE__*/React.createElement(Sec, {
    band: "white",
    inner: {
      display: 'flex',
      flexDirection: 'column',
      gap: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 32,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section"
  }, "Insights"), /*#__PURE__*/React.createElement(DS.TextLink, null, "Documentation")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement(DS.TileCard, {
    kind: "resource",
    eyebrow: "Explainer",
    title: "Active vs. passive \u2014 what the word has to mean",
    color: "cobalt",
    accent: "vermilion"
  }), /*#__PURE__*/React.createElement(DS.TileCard, {
    kind: "resource",
    eyebrow: "Comparison",
    title: "Provisa and Starburst",
    color: "vermilion",
    accent: "cobalt",
    onClick: e => {
      e.preventDefault();
      go('Compare');
    }
  }), /*#__PURE__*/React.createElement(DS.TileCard, {
    kind: "resource",
    eyebrow: "Migration guide",
    title: "Coming from Hasura v2",
    color: "forest",
    accent: "paper"
  }), /*#__PURE__*/React.createElement(DS.TileCard, {
    kind: "resource",
    eyebrow: "Position paper",
    title: "Domains as products, config promotion, and the compute bill",
    color: "ink",
    accent: "vermilion"
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: 'clamp(72px,9vw,120px) 40px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 56
    }
  }, /*#__PURE__*/React.createElement(DS.Heading, {
    level: "section",
    style: {
      flex: '1 1 280px',
      fontSize: 'clamp(34px,4vw,54px)'
    }
  }, "Frequently asked"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '2 1 560px',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(DS.Accordion, {
    items: FAQ,
    onLink: link
  }))), /*#__PURE__*/React.createElement(ContactBand, {
    title: "See it on your data before anyone talks pricing.",
    sub: "Or skip the call entirely: start a free trial, or pip install it tonight."
  }));
}
window.HomePage = HomePage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/HomePage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Shared.jsx
try { (() => {
const DS = window.ProvisaDesignSystem_af580e;
const Sec = ({
  children,
  band,
  style,
  inner
}) => {
  const bg = {
    white: {
      background: '#fff',
      borderTop: '1px solid var(--rule)',
      borderBottom: '1px solid var(--rule)'
    },
    forest: {
      background: 'var(--forest)',
      color: '#fff'
    },
    ink: {
      background: 'var(--ink)',
      color: 'var(--on-ink-1)'
    }
  }[band];
  const body = /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: 'clamp(72px,9vw,136px) 40px',
      ...inner
    }
  }, children);
  return bg ? /*#__PURE__*/React.createElement("section", {
    style: {
      ...bg,
      ...style
    }
  }, body) : /*#__PURE__*/React.createElement("section", {
    style: style
  }, body);
};
const RailGrid = ({
  num,
  label,
  figure,
  dark,
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))',
    gap: '48px 64px'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    alignSelf: 'start'
  }
}, /*#__PURE__*/React.createElement(DS.SectionLabel, {
  num: num,
  dark: dark
}, label), /*#__PURE__*/React.createElement(DS.FigPanel, {
  figure: figure,
  label: 'FIG. ' + num
})), /*#__PURE__*/React.createElement("div", {
  style: {
    gridColumn: 'span 2',
    minWidth: 'min(100%,600px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 40
  }
}, children));
const P = ({
  children,
  c = 'var(--gray-700)',
  s = 16.5,
  style
}) => /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: s,
    lineHeight: 1.65,
    color: c,
    textWrap: 'pretty',
    margin: 0,
    ...style
  }
}, children);
function ContactBand({
  tone = 'forest',
  title,
  sub,
  go
}) {
  const ink = tone === 'ink';
  return /*#__PURE__*/React.createElement("section", {
    id: "contact",
    style: {
      background: ink ? 'var(--ink)' : 'var(--forest)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: 'clamp(72px,9vw,128px) 40px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
      gap: 64
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, ink && /*#__PURE__*/React.createElement(DS.BrandBars, null), /*#__PURE__*/React.createElement(DS.Heading, {
    level: "cta"
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      lineHeight: 1.55,
      color: ink ? 'var(--on-ink-2)' : 'var(--forest-on-1)',
      margin: 0
    }
  }, sub), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 28,
      flexWrap: 'wrap',
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement(DS.TextLink, {
    tone: "inverse"
  }, "Start a free trial"), /*#__PURE__*/React.createElement(DS.TextLink, {
    tone: "inverse"
  }, "Try it on your data"), /*#__PURE__*/React.createElement(DS.TextLink, {
    tone: "inverse"
  }, "Download"))), /*#__PURE__*/React.createElement(DS.DemoForm, null)));
}
const HeroCTAs = () => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap'
  }
}, /*#__PURE__*/React.createElement(DS.Button, {
  href: "#contact"
}, "Book a demo"), /*#__PURE__*/React.createElement(DS.Button, {
  variant: "secondary"
}, "Start a free trial"));
Object.assign(window, {
  DS,
  Sec,
  RailGrid,
  P,
  ContactBand,
  HeroCTAs
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Shared.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.TextLink = __ds_scope.TextLink;

__ds_ns.FigPanel = __ds_scope.FigPanel;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.BrandBars = __ds_scope.BrandBars;

__ds_ns.Callout = __ds_scope.Callout;

__ds_ns.ChoiceCard = __ds_scope.ChoiceCard;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.Heading = __ds_scope.Heading;

__ds_ns.Emph = __ds_scope.Emph;

__ds_ns.RuledCard = __ds_scope.RuledCard;

__ds_ns.StatStrip = __ds_scope.StatStrip;

__ds_ns.TileCard = __ds_scope.TileCard;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.CodeBlock = __ds_scope.CodeBlock;

__ds_ns.CodeTabs = __ds_scope.CodeTabs;

__ds_ns.ComparisonTable = __ds_scope.ComparisonTable;

__ds_ns.LayerRow = __ds_scope.LayerRow;

__ds_ns.Accordion = __ds_scope.Accordion;

__ds_ns.DemoForm = __ds_scope.DemoForm;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.SubscribeField = __ds_scope.SubscribeField;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.ToggleButtons = __ds_scope.ToggleButtons;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.SiteFooter = __ds_scope.SiteFooter;

__ds_ns.SiteHeader = __ds_scope.SiteHeader;

__ds_ns.UtilityBar = __ds_scope.UtilityBar;

})();
