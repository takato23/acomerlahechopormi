import { createRequire as VPV_createRequire } from "node:module";
import { fileURLToPath as VPV_fileURLToPath } from "node:url";
import { dirname as VPV_dirname } from "node:path";
const require = VPV_createRequire(import.meta.url);
const __filename = VPV_fileURLToPath(import.meta.url);
const __dirname = VPV_dirname(__filename);


// api/tsconfig.json
var compilerOptions = {
  target: "esnext",
  module: "esnext",
  moduleResolution: "node",
  lib: ["esnext", "dom", "dom.iterable", "deno"],
  jsx: "react-jsx",
  esModuleInterop: true,
  forceConsistentCasingInFileNames: true,
  strict: true,
  skipLibCheck: true,
  allowSyntheticDefaultImports: true,
  resolveJsonModule: true,
  isolatedModules: true,
  noEmit: true,
  baseUrl: ".",
  paths: {}
};
var include = ["./**/*.ts"];
var exclude = ["node_modules"];
var tsconfig_default = {
  compilerOptions,
  include,
  exclude
};
export {
  compilerOptions,
  tsconfig_default as default,
  exclude,
  include
};
