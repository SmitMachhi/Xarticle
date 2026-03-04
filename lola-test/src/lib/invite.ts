import { customAlphabet } from 'nanoid';

import { DEFAULT_INVITE_SIZE } from '../constants';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const createInvite = customAlphabet(INVITE_ALPHABET, DEFAULT_INVITE_SIZE);

export const makeInviteCode = (): string => {
  return createInvite();
};
