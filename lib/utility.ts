// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import iconDefs from 'icon-definitions';

export interface Icon {
  name: string;
  extensions?: string[];
  files?: string[];
  svg: string;
}

const defaultIcon: Icon = iconDefs.defaultIcon;
export { defaultIcon };

export function getIcon(filename: string): Icon {

  if (typeof filename === 'string') {

    // Check complete filename first
    let icon = iconDefs.icons.find(i => i.files && i.files.some(f => f.localeCompare(filename, undefined, { sensitivity: 'accent' }) === 0));
    if (icon) return icon;

    // The extensions, can match multiple which leads to this quite inefficient way of matching.
    const matches = iconDefs.icons.filter(i => i.extensions && i.extensions.some(ext => filename.endsWith('.' + ext)));
    if (matches.length > 0) {
      let matchLength = 0;
      for (const match of matches) {
        for (const ext of match.extensions) {
          if (ext.length > matchLength && filename.endsWith('.' + ext)) {
            matchLength = ext.length;
            icon = match;
          }
        }
      }
    }
    if (icon) return icon;

  }

  // Finally fall back to default icon
  return defaultIcon;
}

export function getAllIcons(): Array<Icon> {
  return [defaultIcon, ...iconDefs.icons];
}
