import { useCallback, useContext, useEffect } from 'react';

import type { Namespace } from '../../../constants';
import { IS_BROWSER, IS_PROD } from '../../../constants';
import { i18nCookieName } from '../../karma/i18n';
import type { WithChildren } from '../../karma/types';
import type { I18NContextDefinition } from './I18NContext';
import { I18NContext } from './I18NContext';

type NormalizeArgs = {
  namespace?: Namespace;
  key: string | [Namespace, string];
};

const normalize = ({
  namespace,
  key,
}: NormalizeArgs): [Namespace | undefined, string] => {
  if (namespace) {
    // different namespace access
    if (Array.isArray(key)) {
      return key;
    }

    // different namespace access
    if (key.includes(':')) {
      return key.split(':') as [Namespace, string];
    }

    // predefined namespace access
    return [namespace, key];
  }

  // adhoc namespace access
  if (Array.isArray(key)) {
    return key;
  }

  // adhoc namespace access
  if (key.includes(':')) {
    return key.split(':') as [Namespace, string];
  }

  return [undefined, key];
};

const warn = IS_PROD
  ? undefined
  : (() => {
      const caches = {
        exists: new Set<string>(),
        interpolation: new Set<string>(),
      };

      return {
        add: (cache: keyof typeof caches, key: string) => {
          if (!caches[cache].has(key)) {
            const message =
              cache === 'exists'
                ? `unknown i18n key "${key}"`
                : `invalid interpolation for "${key}"`;

            // eslint-disable-next-line no-console
            console.warn(`%c⚠️ [Karma/t] ${message}`, 'color: orange;');

            caches[cache].add(key);
          }
        },
      };
    })();

type Interpolation = Record<string, string | number>;

const interpolate = (
  match: string,
  interpolation: Interpolation,
  { namespace, key }: { namespace: string; key: string }
): string => {
  return Object.entries(interpolation).reduce((carry, [placeholder, value]) => {
    const ph = `{{${placeholder}}}`;
    const exists = carry.includes(ph);

    if (exists) {
      return carry.replace(ph, `${value}`);
    }

    warn?.add('interpolation', `${ph}@${namespace}:${key}`);

    return carry;
  }, match);
};

export type TFunction = (
  key: string | [Namespace, string],
  interpolation?: Interpolation
) => string;
export type UseTranslationReturn = {
  language: string;
  t: TFunction;
};

export function useTranslation(namespace?: Namespace): UseTranslationReturn {
  const ctx = useContext(I18NContext);

  const t: TFunction = useCallback(
    (key, interpolation): string => {
      // no bundle, only cry
      if (!ctx?.resources || !ctx?.language) {
        return Array.isArray(key) ? key.join(':') : key;
      }

      const [safeNamespace, safeKey] = normalize({ key, namespace });

      if (safeNamespace) {
        const match = ctx.resources[ctx.language][safeNamespace]?.[safeKey];

        if (match) {
          if (interpolation) {
            return interpolate(match, interpolation, {
              key: safeKey,
              namespace: safeNamespace,
            });
          }

          return match;
        }

        const merged = `${safeNamespace}:${safeKey}`;

        warn?.add('exists', merged);

        return merged;
      }

      warn?.add('exists', safeKey);

      return safeKey;
    },
    [ctx, namespace]
  );

  if (!ctx) {
    throw new Error(
      '[Karma/useTranslation] called outside of an I18NContextProvider.'
    );
  }

  return { language: ctx.language, t };
}
export type I18NContextProvider = WithChildren<I18NContextDefinition>;

export function I18NContextProvider({
  children,
  language,
  resources,
}: I18NContextProvider): JSX.Element {
  useEffect(() => {
    if (IS_BROWSER) {
      const html = document.querySelector('html');

      if (html) {
        html.setAttribute('lang', language);

        /**
         * @see https://meta.wikimedia.org/wiki/Template:List_of_language_names_ordered_by_code
         */
        const RTL_LANGUAGES = new Set([
          'ar', // Arabic
          'arc', // Aramaic
          'dv', // Divehi
          'fa', // Persian
          'ha', // Hakka Chinese
          'he', // Hebrew
          'khw', // Khowar
          'ks', // Kashmiri
          'ku', // Kurdish
          'ps', // Pashto
          'ur', // Urdu
          'yi', // Yiddish
        ]);

        html.setAttribute('dir', RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr');

        document.cookie = `${i18nCookieName}=${language}; max-age=31536000; path=/`;

        // set initially aswell
        html.setAttribute('lang', language);
      }
    }
  }, [language]);

  // no need to memoize - whenever language changes, resources change too
  // which only ever happens during navigation
  const value = {
    language,
    resources,
  };

  return <I18NContext.Provider value={value}>{children}</I18NContext.Provider>;
}
