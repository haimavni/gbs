import { polyfill as polyfillStringIncludes } from './string.includes';

export function configure() {
    polyfillStringIncludes();
}