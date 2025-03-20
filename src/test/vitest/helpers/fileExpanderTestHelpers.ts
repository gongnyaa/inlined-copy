import { FileExpander } from '../../../fileExpander';
import { FileExpanderPrivate } from '../mocks/types';

/**
 * Access private members of FileExpander for testing
 * @returns FileExpander with access to private members
 */
export function getFileExpanderPrivate(): FileExpanderPrivate {
  return FileExpander as unknown as FileExpanderPrivate;
}
