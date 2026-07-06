export type MotifKind = 'net' | 'play' | 'pagination' | 'merge';

export interface ProjectLink {
  label: string;
  href: string;
  /** honesty tag — merged is merged, open is open */
  tag?: 'merged' | 'open';
}

export interface Project {
  id: string;
  index: string;
  title: string;
  blurb: string;
  proves: string;
  motif: MotifKind;
  links: ProjectLink[];
}

export const PROJECTS: Project[] = [
  {
    id: 'net-vision',
    index: '01',
    title: 'rn-net-vision',
    blurb:
      'A real-time network debugger for mobile apps — a Chrome-DevTools-style ' +
      'dashboard fed by native Swift & Kotlin interceptors over a WebSocket bridge. ' +
      'Built solo to fill the hole Flipper left, and it works where nothing else ' +
      'does: SSL-pinned enterprise apps.',
    proves: 'Native depth most JS engineers never reach',
    motif: 'net',
    links: [
      { label: 'GitHub', href: 'https://github.com/omeratt/rn-net-vision' },
      { label: 'Deep dive', href: 'https://medium.com/p/9dc1095dcd1b' },
    ],
  },
  {
    id: 'here',
    index: '02',
    title: 'Here',
    blurb:
      'A task app for ADHD brains, designed from lived experience. Tasks feel light, ' +
      'wins feel loud, and Playground Mode turns organizing your day into something ' +
      'you want to touch — every spring hand-tuned.',
    proves: 'Empathy, shipped with polish',
    motif: 'play',
    links: [
      { label: 'Live app', href: 'https://here-adhd.vercel.app/' },
      { label: 'GitHub', href: 'https://github.com/omeratt/HereApp-FrontEnd' },
    ],
  },
  {
    id: 'pagination',
    index: '03',
    title: 'reanimated-pagination',
    blurb:
      'A published pagination library — fade, slide and liquid indicator modes, ' +
      'everything running on the UI thread so nothing ever waits on JavaScript. ' +
      'Animation craft, packaged as an API other engineers can hold.',
    proves: 'Performance-minded animation, as a product',
    motif: 'pagination',
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/omeratt/react-native-reanimated-pagination',
      },
    ],
  },
  {
    id: 'upstream',
    index: '04',
    title: 'Open source, upstream',
    blurb:
      'A cross-platform native fix merged into react-native-ssl-pinning, and a deeper ' +
      'one still open against react-native-app-auth. Other people’s codebases, ' +
      'other maintainers’ bars.',
    proves: 'Code that holds up under review I don’t control',
    motif: 'merge',
    links: [
      {
        label: 'ssl-pinning PR',
        href: 'https://github.com/MaxToyberman/react-native-ssl-pinning/pull/217',
        tag: 'merged',
      },
      {
        label: 'app-auth PR',
        href: 'https://github.com/FormidableLabs/react-native-app-auth/pulls?q=is%3Apr+author%3Aomeratt',
        tag: 'open',
      },
    ],
  },
];
