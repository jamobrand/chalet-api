import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { ExpressMiddleware, SanitizeOptions } from '../types/types';
import { sanitize } from './sanitize.util';

export const xssMiddleware = (options?: SanitizeOptions): ExpressMiddleware => {
  return (req, _res, next) => {
    req.body = sanitize(req.body, options);
    req.query = sanitize(req.query, options) as unknown as ParsedQs;
    req.params = sanitize(req.params, options) as unknown as ParamsDictionary;

    next();
  };
};
