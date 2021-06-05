import rollup from 'rollup'
import typescript from 'rollup-plugin-typescript2'
import { readFile } from 'fs-extra'
import util from 'util';
import { optimize, extendDefaultPlugins } from 'svgo';
import languageMap from 'language-map';

const SRC_BASE = 'node_modules/material-icon-theme/';
const IMPORT_NAME = 'icon-definitions';
const FILE_ID = IMPORT_NAME + '.js';
const eval2 = eval;
const usedExtensions = new Set();

async function inlineSvg(fileName, prefix) {
  const image = await readFile(fileName);
  const result = optimize(image.toString(), {
    path: fileName,
    plugins: extendDefaultPlugins([
      { 
        name: 'addAttributesToSVGElement', 
        params: {
          attributes: [{ style: 'width: 100%; height: 100%'}]
        } 
      },
      { name: 'prefixIds', active: true, params: { prefix } },
      { name: 'removeViewBox', active: false },
      'convertStyleToAttrs',
      'removeDimensions',
      'removeStyleElement',
    ])
  });
  return result.data;
}

function getLanguageExtensions(lang) {
  const key = Object.keys(languageMap).find(k => k.toLowerCase() === lang);
  if (key && languageMap[key].extensions) {
    return languageMap[key].extensions.map(ext => ext.slice(1)).filter(ext => !usedExtensions.has(ext));
  }
  return [];
}

export default function iconDefinitionsResolver() {
  return ({
    name: 'icon-definitions',
    resolveId(source) {
      if (source === IMPORT_NAME) {
        return FILE_ID;
      }
    },
    async load(id) {
      if (id === FILE_ID) {
        const bundle = await rollup.rollup({
          input: `${SRC_BASE}/src/icons/fileIcons.ts`,
          plugins: [
            typescript(),
          ]
        });
        const { output } = await bundle.generate({
          format: 'es'
        });
        for (const chunkOrAsset of output) {
          if (chunkOrAsset.type !== 'asset') {
            for (let file in chunkOrAsset.modules) {
              const module = chunkOrAsset.modules[file];
              if (module.renderedExports.includes('fileIcons')) {
                let code = eval2('var IconPack = {}; ' + module.code + ' fileIcons');

                code.defaultIcon.svg = await inlineSvg(`${SRC_BASE}/icons/${code.defaultIcon.name}.svg`, code.defaultIcon.name);

                for (let i = code.icons.length - 1; i >= 0; i--) {
                  if (code.icons[i].enabledFor) {
                    code.icons.splice(i, 1);
                  }
                  else if (code.icons[i].fileExtensions) {                    
                    code.icons[i].fileExtensions.forEach(ext => usedExtensions.add(ext));
                  }
                }

                for (let icon of code.icons) {                    
                  const extensions = Array.from(new Set([
                    ...(icon.fileExtensions ? icon.fileExtensions : []), 
                    ...getLanguageExtensions(icon.name)
                  ]));
                  if (extensions.length > 0) {
                    icon.extensions = extensions;
                  }
                  if (icon.fileNames) {
                    icon.files = icon.fileNames;
                  }
                  delete icon.light;
                  delete icon.fileExtensions;
                  delete icon.fileNames;
                  icon.svg = await inlineSvg(`${SRC_BASE}/icons/${icon.name}.svg`, icon.name);
                }

                console.log('Compiled', code.icons.length + 1, 'icons');

                return {
                  code: 'export default ' + util.inspect(code, { maxArrayLength: Infinity, depth: Infinity }),
                  map: { mappings: '' },
                }
              }
            }
          }
        }
      }
    }
  });
}
