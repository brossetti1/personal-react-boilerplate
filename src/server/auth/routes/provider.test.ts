import {
  testLambda,
  RequestMethods,
  RequestMethod,
} from '../../../../testUtils/lambda';
import { ExternalProvider } from '../../../client/context/AuthContext/AuthContext';
import { ENABLED_PROVIDER } from '../../../constants';
import {
  NOT_FOUND,
  FOUND_MOVED_TEMPORARILY,
  INTERNAL_SERVER_ERROR,
} from '../../../utils/statusCodes';
import * as cookieUtils from '../cookie';
import * as oauthTools from '../oauth';
import provider from './provider';

const url = '/api/v1/auth/provider';
const catchAllName = 'authRouter';
const method: RequestMethod = 'GET';
const redirect = 'manual';

describe('api/provider', () => {
  test('should be a function', () => {
    expect(provider).toBeInstanceOf(Function);
  });

  RequestMethods.filter(requestMethod => requestMethod !== method).forEach(
    method => {
      test(`does nothing on method "${method}"`, async () => {
        const response = await testLambda(provider, {
          catchAllName,
          method,
          url,
        });

        expect(response.status).toBe(NOT_FOUND);
      });
    }
  );

  ENABLED_PROVIDER.filter(provider => provider !== 'local').forEach(
    externalProvider => {
      test(`responds with a redirect given no additional params (provider: ${externalProvider})`, async () => {
        const response = await testLambda(provider, {
          catchAllName,
          method,
          redirect,
          url: url.replace('provider', externalProvider),
        });

        expect(response.status).toBe(FOUND_MOVED_TEMPORARILY);
        expect(response.headers.has('Location')).toBeTruthy();
        expect(
          response.headers.get('Location')?.includes(externalProvider)
        ).toBeTruthy();
      });

      test(`errors given an error query (provider: ${externalProvider})`, async () => {
        const consoleError = console.error;
        const consoleErrorSpy = jest
          .spyOn(console, 'error')
          .mockImplementationOnce(() => {});

        const error = 'some-error';

        const response = await testLambda(provider, {
          catchAllName,
          method,
          redirect,
          searchParams: {
            error,
          },
          url: url.replace('provider', externalProvider),
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith(error);

        expect(response.status).toBe(INTERNAL_SERVER_ERROR);

        console.error = consoleError;
      });

      test(`errors given more than one query param, but no code (provider: ${externalProvider})`, async () => {
        const response = await testLambda(provider, {
          catchAllName,
          method,
          redirect,
          searchParams: {
            bar: 'bar',
            baz: 'baz',
            foo: 'foo',
          },
          url: url.replace('provider', externalProvider),
        });

        expect(response.status).toBe(INTERNAL_SERVER_ERROR);
      });

      test(`errors given more than one code (provider: ${externalProvider})`, async () => {
        const searchParams = new URLSearchParams();

        searchParams.append('code', 'a');
        searchParams.append('code', 'b');

        const response = await testLambda(provider, {
          catchAllName,
          method,
          redirect,
          searchParams,
          url: url.replace('provider', externalProvider),
        });

        expect(response.status).toBe(INTERNAL_SERVER_ERROR);
      });

      test(`attempts to load OAuthData (provider: ${externalProvider})`, async () => {
        const code = 'code';

        const searchParams = new URLSearchParams();

        searchParams.append('code', code);

        const getOAuthDataSpy = jest.spyOn(oauthTools, 'getOAuthData');

        await testLambda(provider, {
          catchAllName,
          method,
          redirect,
          searchParams,
          url: url.replace('provider', externalProvider),
        });

        expect(getOAuthDataSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            code,
            prompt: undefined,
            provider: externalProvider,
            redirect_uri: expect.any(String),
          })
        );
      });

      test(`loads profile data based on data received from getOAuthData (provider: ${externalProvider})`, async () => {
        const code = 'code';

        const searchParams = new URLSearchParams();

        searchParams.append('code', code);

        const oauthResponse = {
          access_token: 'access_token',
          expires_in: Date.now() + 1000,
          refresh_token: 'refresh_token',
          scope: 'scope',
          token_type: 'token_type',
        };

        jest
          .spyOn(oauthTools, 'getOAuthData')
          .mockImplementationOnce(
            () => new Promise(resolve => resolve(oauthResponse))
          );

        const getProfileDataSpy = jest.spyOn(oauthTools, 'getProfileData');

        await testLambda(provider, {
          catchAllName,
          method,
          redirect,
          searchParams,
          url: url.replace('provider', externalProvider),
        });

        expect(getProfileDataSpy).toHaveBeenCalledWith(
          oauthTools.config[externalProvider as ExternalProvider]
            .profileDataUrl,
          externalProvider,
          oauthResponse
        );
      });

      test(`encrypts session data (provider: ${externalProvider})`, async () => {
        const code = 'code';

        const searchParams = new URLSearchParams();

        searchParams.append('code', code);

        const oauthResponse = {
          access_token: 'access_token',
          expires_in: Date.now() + 1000,
          refresh_token: 'refresh_token',
          scope: 'scope',
          token_type: 'token_type',
        };

        const fakeProfile = {
          user: 'ljosberinn',
        };

        jest
          .spyOn(oauthTools, 'getOAuthData')
          .mockImplementationOnce(
            () => new Promise(resolve => resolve(oauthResponse))
          );

        jest
          .spyOn(oauthTools, 'getProfileData')
          .mockImplementationOnce(
            () => new Promise(resolve => resolve(fakeProfile))
          );

        const encryptSessionSpy = jest.spyOn(cookieUtils, 'encryptSession');

        await testLambda(provider, {
          catchAllName,
          method,
          redirect,
          searchParams,
          url: url.replace('provider', externalProvider),
        });

        expect(encryptSessionSpy).toHaveBeenCalledWith(fakeProfile);
      });

      test(`sets the cookie on response (provider: ${externalProvider})`, async () => {
        const code = 'code';

        const searchParams = new URLSearchParams();

        searchParams.append('code', code);

        const oauthResponse = {
          access_token: 'access_token',
          expires_in: Date.now() + 1000,
          refresh_token: 'refresh_token',
          scope: 'scope',
          token_type: 'token_type',
        };

        const fakeProfile = {
          user: 'ljosberinn',
        };

        const fakeCookie = 'fakeCookie';

        jest
          .spyOn(oauthTools, 'getOAuthData')
          .mockImplementationOnce(
            () => new Promise(resolve => resolve(oauthResponse))
          );

        jest
          .spyOn(oauthTools, 'getProfileData')
          .mockImplementationOnce(
            () => new Promise(resolve => resolve(fakeProfile))
          );

        jest
          .spyOn(cookieUtils, 'encryptSession')
          .mockImplementationOnce(
            () => new Promise(resolve => resolve(fakeCookie))
          );

        const setSessionCookieSpy = jest.spyOn(cookieUtils, 'setSessionCookie');

        await testLambda(provider, {
          catchAllName,
          method,
          redirect,
          searchParams,
          url: url.replace('provider', externalProvider),
        });

        expect(setSessionCookieSpy).toHaveBeenCalledWith(
          fakeCookie,
          expect.any(Object)
        );
      });

      test(`redirects on successful authentication (provider: ${externalProvider})`, async () => {
        const code = 'code';

        const searchParams = new URLSearchParams();

        searchParams.append('code', code);

        const oauthResponse = {
          access_token: 'access_token',
          expires_in: Date.now() + 1000,
          refresh_token: 'refresh_token',
          scope: 'scope',
          token_type: 'token_type',
        };

        const fakeProfile = {
          user: 'ljosberinn',
        };

        const fakeCookie = 'fakeCookie';

        jest
          .spyOn(oauthTools, 'getOAuthData')
          .mockImplementationOnce(
            () => new Promise(resolve => resolve(oauthResponse))
          );

        jest
          .spyOn(oauthTools, 'getProfileData')
          .mockImplementationOnce(
            () => new Promise(resolve => resolve(fakeProfile))
          );

        jest
          .spyOn(cookieUtils, 'encryptSession')
          .mockImplementationOnce(
            () => new Promise(resolve => resolve(fakeCookie))
          );

        jest.spyOn(cookieUtils, 'setSessionCookie');

        const response = await testLambda(provider, {
          catchAllName,
          method,
          redirect,
          searchParams,
          url: url.replace('provider', externalProvider),
        });

        expect(response.status).toBe(FOUND_MOVED_TEMPORARILY);
        expect(response.headers.has('Location')).toBeTruthy();
      });
    }
  );
});
