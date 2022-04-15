import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { applyPatches, createPatch} from './index.js';


const argv = await yargs(hideBin(process.argv))
  .option('directory',{
    alias:'d',
    type: 'string',
    default: 'patches'
  })
  .command('apply [options]','apply patches to your node_modules',() => {
  }, async (argv) =>{
    await applyPatches(`${argv.directory}/**/*.patch`);
  })
  .command('create <packageName> [options]','create patches from your node_modules',() => {
  }, async (argv) =>{
    await createPatch(argv.packageName as string,argv.directory);
  })
  .parseAsync();
