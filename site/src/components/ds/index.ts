/**
 * Provisa design system — components.
 *
 * Presentational React components. The site renders them to static HTML at
 * build time (no client-side React); scripts/pack-design-system.mjs bundles the
 * same modules as `window.Provisa` for the Design System artifact. Styles live
 * in src/styles/ds.css; interactivity in ./behaviors.ts.
 */
export { Actions, Body, Button, Eyebrow, Grid, Links, Logo, SectionIndex, Switch, Tag, Tags, TextLink, Tricolor } from './primitives';
export { Block, Breadcrumb, Editorial, Feature, PageHero, RailLayout, Section, SplitHeader } from './layout';
export {
  Callout,
  FigureArt,
  LayerDetail,
  LayerList,
  Legend,
  ProtocolList,
  Stack,
  StackArrow,
  StackCells,
  StackFills,
  StackHead,
  StackNode,
  StackNote,
  StackPanel,
  StackRow,
  Trace,
} from './diagrams';
export {
  Card,
  Checklist,
  ComparisonTable,
  DownloadList,
  Figure,
  IndustryCard,
  Matrix,
  Prose,
  ResourceCard,
  RuleCard,
  RuleList,
  StatRow,
  Steps,
  TierList,
  TintCard,
} from './content';
export { CodeBlock, CodeTabs, lines } from './code';
export { Accordion, RoleSwitcher, Tabs } from './interactive';
export { ApiForm, ContactSection, DemoForm, Field, FormStatus, Honeypot, SiteFooter, SiteHeader, UtilityBar } from './chrome';
export { FIGURES } from './figures';
export { initBehaviors } from './behaviors';
export { rich } from './rich';

export type { Code, CodeLine, CodeSeg, CodeTab, CommentStyle } from './code';
export type { FigName } from './figures';
export type { Crumb, HeroAction, Tone } from './layout';
export type { ComparisonRow, DownloadItem, MatrixRow } from './content';
export type { AccordionItem, RoleState, TabItem } from './interactive';
export type { LayerDetailItem, LayerSummary, ProtocolData, TraceStepData } from './diagrams';
export type { FooterColumn, NavLink } from './chrome';
