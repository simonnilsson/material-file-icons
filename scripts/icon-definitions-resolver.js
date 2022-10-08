import rollup from 'rollup'
import typescript from 'rollup-plugin-typescript2'
import { readFile } from 'fs-extra'
import util from 'util';
import { optimize } from 'svgo';
import { getLanguages } from './vscode-extensions';

const SRC_BASE = 'node_modules/material-icon-theme/';
const IMPORT_NAME = 'icon-definitions';
const FILE_ID = IMPORT_NAME + '.js';
const eval2 = eval;
const usedExtensions = new Set();

async function inlineSvg(fileName, prefix) {
  const image = await readFile(fileName);
  const result = optimize(image.toString(), {
    path: fileName,
    plugins: [
      { 
        name: 'preset-default',
        params: {
          overrides:  {
            removeViewBox: false
          }
        }
      },
      { 
        name: 'addAttributesToSVGElement', 
        params: {
          attributes: [{ style: 'width: 100%; height: 100%'}]
        } 
      },
      { name: 'prefixIds', active: true, params: { prefix } },
      'convertStyleToAttrs',
      'removeDimensions',
      'removeStyleElement',
    ]
  });
  return result.data;
}

async function addIcon(output, name, extensions, files) {

  if (!extensions?.length && !files?.length) {
    return;
  }

  let outputIcon = output.icons.find(i => i.name === name);

  // Add icon to output if new.
  if (!outputIcon) {
    outputIcon = {
      name,
      svg: await inlineSvg(`${SRC_BASE}/icons/${name}.svg`, name)
    };
    output.icons.push(outputIcon);
  }

  if (extensions?.length) {
    // Add extensions to output
    outputIcon.extensions = Array.from(new Set([
      ...(outputIcon.extensions ? outputIcon.extensions : []), 
      ...extensions.filter(ext => !usedExtensions.has(ext)),
    ]));

    // Add used extensions
    extensions.forEach(ext => usedExtensions.add(ext));
  }

  if (files?.length) {
    // Add files to output
    outputIcon.files = Array.from(new Set([
      ...(outputIcon.files ? outputIcon.files : []), 
      ...files,
    ]));
  }
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
          input: [
            `${SRC_BASE}/src/icons/fileIcons.ts`, 
            `${SRC_BASE}/src/icons/languageIcons.ts`,
          ],
          plugins: [
            typescript(),
          ]
        });

        const { output: bundleOutput } = await bundle.generate({
          format: 'es'
        });

        const output = {
          icons: []
        };

        for (const chunkOrAsset of bundleOutput) {
          if (chunkOrAsset.type !== 'asset') {
            for (let file in chunkOrAsset.modules) {
              const module = chunkOrAsset.modules[file];

              if (module.renderedExports.includes('fileIcons')) {
                const fileIcons = eval2('var IconPack = {}; ' + module.code + ' fileIcons');

                output.defaultIcon = { 
                  name: fileIcons.defaultIcon.name,
                  svg: await inlineSvg(`${SRC_BASE}/icons/${fileIcons.defaultIcon.name}.svg`, fileIcons.defaultIcon.name)
                }

                for (let icon of fileIcons.icons) {                  
                  // Ignore conditional icons
                  if (icon.enabledFor) {
                    continue;
                  }
                  await addIcon(output, icon.name, icon.fileExtensions, icon.fileNames);
                }
              }

              if (module.renderedExports.includes('languageIcons')) {
                let languageIcons = eval2(module.code + ' languageIcons');
                let vscodeLanguages = await getLanguages();
                for (let languageIcon of languageIcons) {
                  let extensions = languageIcon.ids.map(id => Array.from(vscodeLanguages.get(id)?.extensions ?? [])).flat();
                  let files = languageIcon.ids.map(id => Array.from(vscodeLanguages.get(id)?.filenames ?? [])).flat();                  
                  await addIcon(output, languageIcon.icon.name, extensions, files);
                }
              }
            }
          }
        }

        console.log('Compiled', output.icons.length + 1, 'icons');

        return {
          code: 'export default ' + util.inspect(output, { maxArrayLength: Infinity, depth: Infinity, maxStringLength: Infinity }),
          map: { mappings: '' },
        }
      }
    }
  });
}
