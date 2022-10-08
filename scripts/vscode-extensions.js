import { Octokit } from '@octokit/core';
import AdmZip from 'adm-zip';

export async function getLanguages() {

  const languages = new Map();
  
  const octokit = new Octokit({});

  const res = await octokit.request('GET /repos/{owner}/{repo}/zipball', {
    owner: 'microsoft',
    repo: 'vscode',
  });

  const zip = new AdmZip(Buffer.from(res.data));

  zip.getEntries().forEach((entry) => {
      if (/^[^\/]+\/extensions\/[^\/]+\/package\.json$/.test(entry.entryName)) {
        const data = JSON.parse(entry.getData().toString('utf-8'));
        for (const lang of data.contributes?.languages ?? []) {
          const existing = languages.get(lang.id);
          if (existing) {
            lang.extensions?.forEach(e => existing.extensions.add(e.replace(/^\./, '')));
            lang.filenames?.forEach(e => existing.filenames.add(e));
          }
          else {
            languages.set(lang.id, {
              extensions: new Set(lang.extensions?.map(e => e.replace(/^\./, ''))),
              filenames: new Set(lang.filenames),
            });
          }
        }
      }
  });

  return languages;
}
