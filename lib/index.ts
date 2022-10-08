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
    
    // Use lower case filename for matching
    const lcFilename = filename.toLowerCase();

    // Check complete filename first
    let icon = iconDefs.icons.find(i => i.files && i.files.some(f => f === lcFilename));
    if (icon) return icon;

    // Extensions can have multiple matches, select the longest matching extension.
    let matchLength = 0;
    iconDefs.icons.forEach(i => 
      i.extensions?.forEach(ext => 
        ext.length > matchLength && lcFilename.endsWith('.' + ext) && (icon = i) && (matchLength = ext.length)
      )
    );
    if (icon) return icon;

  }

  // Finally fall back to default icon
  return defaultIcon;
}

export function getAllIcons(): Array<Icon> {
  return [defaultIcon, ...iconDefs.icons];
}
