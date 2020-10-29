/* istanbul ignore file */
import Head from 'next/head';

import { createGetStaticProps } from '../../client/karma/getStaticProps';
import type { LayoutCreator } from '../../client/karma/layout';
import { layoutWithKarma } from '../../client/karma/layout';
import { CommonLayout } from '../../client/layouts/CommonLayout';
import { DocsIndex } from '../../client/routes/Docs';
import type { Namespace } from '../../constants';

// eslint-disable-next-line import/no-default-export
export default function Docs(): JSX.Element {
  return (
    <>
      <Head>
        <title>Karma | Documentation</title>
      </Head>
      <DocsIndex />
    </>
  );
}

const createLayout: LayoutCreator = (page) => (
  <CommonLayout>{page}</CommonLayout>
);

Docs.withLayout = layoutWithKarma(createLayout);

const namespaces: Namespace[] = ['serviceWorker', 'theme', 'i18n'];

export const getStaticProps = createGetStaticProps({
  i18n: {
    namespaces,
  },
});

// import Head from 'next/head';

// import { createGetServerSideProps } from '../../../src/client/karma/getServerSideProps';
// import type { LayoutCreator } from '../../../src/client/karma/layout';
// import { withKarma } from '../../../src/client/karma/layout';
// import { CommonLayout } from '../../../src/client/layouts/CommonLayout';
// import { DocsIndex } from '../../../src/client/routes/Docs';
// import type { Namespace } from '../../../src/constants';

// // eslint-disable-next-line import/no-default-export
// export default function Docs(): JSX.Element {
//   return (
//     <>
//       <Head>
//         <title>Karma | Documentation</title>
//       </Head>
//       <DocsIndex />
//     </>
//   );
// }

// const createLayout: LayoutCreator = (page) => (
//   <CommonLayout>{page}</CommonLayout>
// );

// Docs.withLayout = withKarma(createLayout);

// const namespaces: Namespace[] = ['serviceWorker', 'theme', 'i18n'];

// export const getServerSideProps = createGetServerSideProps({
//   i18n: {
//     namespaces,
//   },
// });