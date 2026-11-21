import type { EslintConfigContext } from '@mnaoumov/obsidian-dev-toolkit/linters/eslint-config';
import type { Linter } from 'eslint';

import { defineEslintConfigs } from '@mnaoumov/obsidian-dev-toolkit/linters/eslint-config';
import { defineConfig } from 'eslint/config';

export const configs: Linter.Config[] = defineEslintConfigs({
  customConfigs(context: EslintConfigContext) {
    return defineConfig(
      // A function that can return "no value" returns `T | null`; the shared config leaves this rule off until its
      // consumers migrate.
      {
        files: context.allFiles(),
        rules: {
          'typescript-dev-toolkit/no-undefined-return-type': 'error'
        }
      }
    );
  }
});
