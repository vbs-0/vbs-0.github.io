/**
 * The colours and lettering of each build, as the sweep and the destination page need them.
 * No DOM access here: components/shared/Sweep.astro imports this at build time.
 */
import { type VariantId, variantMeta } from '@site';
import { palettes } from '@/styles/palettes';

const studio = palettes.studio.dark;
const film = palettes.film.dark;
const graph = palettes.graph.dark;

export interface SweepSkin {
  paper: string;
  /** The alternate band tone: two tones make the sweep read as bands, not a blank sheet. */
  paperAlt: string;
  ink: string;
  accent: string;
  label: string;
  /** One line under the label: what this build is. */
  caption: string;
  font: string;
  stretch: string;
  transform: 'none' | 'uppercase';
}

export const SWEEP_SKINS: Record<VariantId, SweepSkin> = {
  pop: {
    paper: palettes.pop.light.sun!, paperAlt: palettes.pop.light.cream!,
    ink: palettes.pop.light.ink!, accent: palettes.pop.light.blue!,
    label: variantMeta.pop.name, caption: variantMeta.pop.blurb,
    font: "'Bagel Fat One', sans-serif", stretch: '100%', transform: 'none',
  },
  tide: {
    paper: palettes.tide.light.foam!, paperAlt: palettes.tide.light.bg!,
    ink: palettes.tide.light.ink!, accent: palettes.tide.light.blue!,
    label: variantMeta.tide.name, caption: variantMeta.tide.blurb,
    font: "'Fraunces Variable', serif", stretch: '100%', transform: 'none',
  },
  kiln: {
    paper: palettes.kiln.light.putty!, paperAlt: palettes.kiln.light.bg!,
    ink: palettes.kiln.light.ink!, accent: palettes.kiln.light.oxide!,
    label: variantMeta.kiln.name, caption: variantMeta.kiln.blurb,
    font: "'Archivo Variable', sans-serif", stretch: '100%', transform: 'none',
  },
  studio: {
    paper: studio.ink as string,
    paperAlt: studio.inkSoft as string,
    ink: studio.bg as string,
    accent: studio.accent as string,
    label: 'Studio',
    caption: variantMeta.studio.blurb,
    font: "'Bricolage Grotesque Variable', 'Bricolage Grotesque', system-ui, sans-serif",
    stretch: '75%',
    transform: 'none',
  },
  film: {
    paper: film.bg as string,
    paperAlt: film.surface as string,
    ink: film.text as string,
    accent: film.gTitle as string,
    label: 'Film',
    caption: variantMeta.film.blurb,
    font: "'League Gothic Variable', 'League Gothic', 'Arial Narrow', sans-serif",
    stretch: '100%',
    transform: 'uppercase',
  },
  graph: {
    paper: graph.bg as string,
    paperAlt: graph.surface as string,
    ink: graph.text as string,
    accent: graph.signal as string,
    label: 'System map',
    caption: variantMeta.graph.blurb,
    font: "'Archivo Variable', 'Archivo', system-ui, sans-serif",
    stretch: '68%',
    transform: 'uppercase',
  },
  phone: {
    paper: '#e3f1e8',
    paperAlt: '#d3e8dc',
    ink: '#0e1913',
    accent: '#00633c',
    label: 'About phone',
    caption: variantMeta.phone.blurb,
    font: "'Roboto Flex Variable', 'Roboto Flex', system-ui, sans-serif",
    stretch: '122%',
    transform: 'none',
  },
  manual: {
    paper: '#f8fafd',
    paperAlt: '#dfe8f2',
    ink: '#162644',
    accent: '#feed25',
    label: 'Service manual',
    caption: variantMeta.manual.blurb,
    font: "'Archivo Variable', 'Archivo', system-ui, sans-serif",
    stretch: '64%',
    transform: 'uppercase',
  },
  classic: {
    paper: '#070a13',
    paperAlt: '#151c2c',
    ink: '#eef0f6',
    accent: '#edca71',
    label: 'Classic',
    caption: variantMeta.classic.blurb,
    font: "'Mona Sans Variable', 'Mona Sans', system-ui, sans-serif",
    stretch: '118%',
    transform: 'none',
  },
};
