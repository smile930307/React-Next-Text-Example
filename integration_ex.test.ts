import { resetApollo } from 'lib/apollo';
import {
  // TODO: Fix usage of deprecated reducer when it makes sense to refactor
  // eslint-disable-next-line regex/invalid
  mockAppHandler,
  // TODO: Fix usage of deprecated reducer when it makes sense to refactor
  // eslint-disable-next-line regex/invalid
  mockUserHandler,
  mockInitialProps,
  userId,
  userToken,
} from 'tests/utils/dataMocks';
import DocumentLibrary from 'pages/document-library';
import { createRtlRenderer } from 'tests/utils/createRenderer/createRtlRenderer';
import {
  clickOption,
  clickSearchButton,
  expectNoAutoCompleteDropdown,
  expectSearchInputToHaveValue,
  fireEnterKeydownEventOnAutoCompleteItem,
  typeIntoSearchInput,
} from 'DesignSystem/SearchInput/SearchInput.test-utils';
import {
  clickCreateDocumentButton,
  findSearchResults,
  expectSurveyMonkeyRedirect,
  expectLinkToEditPDF,
  expectNoResultsElements,
  expectResultItemElements,
  expectNotRenderPillForNoCategory,
  expectNoPDFPillForNoBuilderType,
  expectCreateDocumentRedirect,
  expectNoCantFindSection,
} from 'tests/pages/document-library/document-library.test-utils';
import {
  clickSuggestADocumentButton,
  clickUploadADocumentLink,
} from 'components/NoResultsOptions/NoResultsOption.test-utils';
import { useRouter } from 'next/router';
import * as TrackingActions from 'Tracking/Actions';
import { expectSignedInTracking } from 'lib/tracking/useTrack.test-utils';
import { screen, waitFor } from '@testing-library/react';
import {
  showMoreDocumentsResolver,
  expectShowMoreButton,
  clickShowMoreButton,
  expectNoShowMoreButton,
  expectLoadingSpinner,
  expectNoLoadingSpinner,
} from 'components/DocumentLibrary/DocumentLibrarySearchResults/DocumentLibrarySearchResults.test-utils';
import { defaultResolvers } from 'tests/utils/AutoMockedProvider/defaultResolvers';
import { expectPopularDocumentsList } from 'DocumentLibrary/PopularDocumentsList/PopularDocumentsList.test-utils';
import { useDecision } from '@optimizely/react-sdk';
import {
  clickSeeAllCategoryButton,
  expectLinkToStaticBuilder,
  expectLinkToFreewriteBuilder,
  clickPopularDocumentsBuilderLink,
  expectCountOfCategoryDocuments,
  getDocumentCountResolver,
} from 'DocumentLibrary/PopularDocumentsList/DocumentsCategory.test-utils';
import {
  exceptDocumentLibraryResultsHeading,
  clickBackToList,
} from 'DocumentLibrary/DocumentLibraryResultsHeading/DocumentLibraryResultsHeading.test-utils';

jest.mock('lib/apollo/createApolloClient');

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockUseDecision = (useDecision as unknown) as jest.MockedFunction<
  (splitTestName: string) => { variationKey: string }[]
>;

describe('pages/document-library', () => {
  const mockUseRouter = useRouter as jest.Mock;
  const mockRouterPush = jest.fn();

  const mockRouter = {
    push: mockRouterPush,
    query: {},
  };

  const trackEventSpy = jest
    .spyOn(TrackingActions, 'trackEvent')
    .mockReturnValue(() => {});

  beforeEach(() => {
    mockUseRouter.mockImplementation(() => mockRouter);
  });

  const reducers = {
    // TODO: Fix usage of deprecated reducer when it makes sense to refactor
    // eslint-disable-next-line regex/invalid
    ...mockAppHandler,
    // TODO: Fix usage of deprecated reducer when it makes sense to refactor
    // eslint-disable-next-line regex/invalid
    ...mockUserHandler,
  };

  const expectedInitialProps = mockInitialProps({
    activeKey: 'document-library',
    cookies: {
      accountemail: 'test+email@formswift.com',
      userid: `${userId}`,
      userToken,
    },
    pathname: '/document-library',
    query: {},
    queryString: '',
    title: 'Document Library',
  });

  const renderDocumentLibrary = createRtlRenderer(DocumentLibrary)
    .withRedux(reducers)
    .withApollo(defaultResolvers);
  const renderDocumentLibraryWithDocumentCount = createRtlRenderer(
    DocumentLibrary
  )
    .withRedux(reducers)
    .withApollo(getDocumentCountResolver);
  const renderDocumentLibraryWithApolloLoadingState = createRtlRenderer(
    DocumentLibrary
  )
    .withRedux(reducers)
    .withApollo(defaultResolvers)
    .withApolloLoadingState?.();

  afterEach(() => {
    jest.clearAllMocks();
    resetApollo();
  });

  it.skip('supports searching for and clicking auto complete results', async () => {
    await renderDocumentLibrary(expectedInitialProps);
    await typeIntoSearchInput('W-2');
    await clickOption(0, 'W-2 Efile 2020');
    expectSearchInputToHaveValue('W-2 Efile 2020');
    const searchResults = await findSearchResults();
    expect(searchResults).toHaveLength(1);
    expectNoAutoCompleteDropdown();
    expect(trackEventSpy).toHaveBeenCalledWith(
      'Search Document | [search terms] | Document Library',
      'W-2 Efile 2020'
    );
  });

  it('fires onclick of search options upon enter keydown while focused', async () => {
    await renderDocumentLibrary(expectedInitialProps);
    await typeIntoSearchInput('W-2');
    fireEnterKeydownEventOnAutoCompleteItem();
    const searchResults = await findSearchResults();
    expect(searchResults).toHaveLength(1);
  });

  it('renders complete list of search results on load', async () => {
    await renderDocumentLibrary(expectedInitialProps);
    const searchResults = await findSearchResults();
    expect(searchResults).toHaveLength(3);
  });

  it('renders the search query param in search input and loads results if present', async () => {
    mockUseRouter.mockImplementation(() => {
      return {
        query: { search: 'Affidavit' },
      };
    });

    await renderDocumentLibrary(expectedInitialProps);
    expectSearchInputToHaveValue('Affidavit');
    const searchResults = await findSearchResults();
    expect(searchResults).toHaveLength(1);
  });

  it('updates search results on search click', async () => {
    await renderDocumentLibrary(expectedInitialProps);
    await typeIntoSearchInput('affidavit');
    clickSearchButton();
    const searchResults = await findSearchResults();
    expect(searchResults).toHaveLength(1);
  });

  it('renders Cant Find What You Need section', async () => {
    await renderDocumentLibrary(expectedInitialProps);
    expectNoResultsElements();
  });

  it('redirects to Survey Monkey and fires tracking event on Suggest a Document button click', async () => {
    await renderDocumentLibrary(expectedInitialProps);
    clickSuggestADocumentButton();
    expectSurveyMonkeyRedirect();
    expectSignedInTracking({
      action: 'Document Library',
      category: 'Suggest A Document',
    });
  });

  it('links to /edit-pdf and fires tracking event on upload button click', async () => {
    await renderDocumentLibrary(expectedInitialProps);
    clickUploadADocumentLink();
    expectLinkToEditPDF();
    expectSignedInTracking({
      action: 'Document Library',
      category: 'Upload A Document',
    });
  });

  it('renders search results item', async () => {
    await renderDocumentLibrary(expectedInitialProps);
    expectResultItemElements();
  });

  it('should not render category pills for no category items', async () => {
    await renderDocumentLibrary(expectedInitialProps);
    expectNotRenderPillForNoCategory();
  });

  it('should not render pdf pills for items with no builder type or for static items', async () => {
    await renderDocumentLibrary(expectedInitialProps);
    expectNoPDFPillForNoBuilderType();
  });

  it('redirects to create document page and fires tracking event on Create Document button click', async () => {
    await renderDocumentLibrary(expectedInitialProps);
    clickCreateDocumentButton();
    expectSignedInTracking({
      action: 'w2-efile-2020',
      category: 'Create Document | [search terms] | Document Library',
    });
    expectCreateDocumentRedirect();
  });

  test.each([
    [
      null,
      'Search Document | [search terms] | Document Library',
      'no search terms',
    ],
    [
      'affidavit',
      'Search Document | [search terms] | Document Library',
      'affidavit',
    ],
  ])(
    'clicking search button fires tracking event',
    async (searchTerm, trackingCategory, trackingAction) => {
      await renderDocumentLibrary(expectedInitialProps);
      if (searchTerm) {
        await typeIntoSearchInput(searchTerm);
      }
      clickSearchButton();
      await findSearchResults();
      expectSignedInTracking({
        action: trackingAction,
        category: trackingCategory,
      });
    }
  );

  test.each([
    ['affidavit', 'Document Library Search', 'affidavit | 1'],
    [
      null,
      'Search Document | [search terms] | Document Library',
      'no search terms',
    ],
  ])(
    'tracking event is fired when the search results are displayed',
    async (searchTerm, trackingCategory, trackingAction) => {
      await renderDocumentLibrary(expectedInitialProps);
      if (searchTerm) {
        await typeIntoSearchInput(searchTerm);
      }
      clickSearchButton();
      await findSearchResults();
      expectSignedInTracking({
        action: trackingAction,
        category: trackingCategory,
      });
    }
  );

  describe('Show More button', () => {
    const renderDocumentLibraryWithShowMore = createRtlRenderer(DocumentLibrary)
      .withRedux(reducers)
      .withApollo(showMoreDocumentsResolver);

    afterEach(() => {
      jest.clearAllMocks();
      resetApollo();
    });

    it('displays show more button when the search results have more documents than limit', async () => {
      await renderDocumentLibraryWithShowMore(expectedInitialProps);
      void expectShowMoreButton();
    });

    it('renders 20 documents by default on search', async () => {
      await renderDocumentLibraryWithShowMore(expectedInitialProps);
      const searchResults = await findSearchResults();
      expect(searchResults).toHaveLength(20);
    });

    it('renders 20 more documents on clicking the show more button', async () => {
      await renderDocumentLibraryWithShowMore(expectedInitialProps);
      await expectShowMoreButton();
      clickShowMoreButton();
      await waitFor(async () => {
        const searchResults = await findSearchResults();
        expect(searchResults).toHaveLength(40);
      });
    });

    it('hides the show more button when it loads less than 20 documents on clicking the button', async () => {
      await renderDocumentLibraryWithShowMore(expectedInitialProps);
      await expectShowMoreButton();
      clickShowMoreButton();
      await expectShowMoreButton();
      clickShowMoreButton();
      await expectNoShowMoreButton();
    });

    it('renders 20 documents when search term changes', async () => {
      await renderDocumentLibraryWithShowMore(expectedInitialProps);
      await typeIntoSearchInput('W-2');
      const searchResults = await findSearchResults();
      await waitFor(() => {
        expect(searchResults).toHaveLength(20);
      });
    });

    it('renders the spinner on page load', async () => {
      await renderDocumentLibraryWithApolloLoadingState?.(expectedInitialProps);
      await expectLoadingSpinner();
    });

    it('should not render the spinner once documents loaded', async () => {
      await renderDocumentLibraryWithShowMore(expectedInitialProps);
      await expectNoLoadingSpinner();
      await expectShowMoreButton();
    });

    it('should render the spinner after clicking show more button', async () => {
      await renderDocumentLibraryWithShowMore(expectedInitialProps);
      await expectShowMoreButton();
      clickShowMoreButton();
      await expectLoadingSpinner();
    });

    it('hides the cant find what you need section on inital documents loading', async () => {
      await renderDocumentLibraryWithApolloLoadingState?.(expectedInitialProps);
      expectNoCantFindSection();
    });

    it('renders the cant find what you need section if results are displayed', async () => {
      await renderDocumentLibraryWithShowMore(expectedInitialProps);
      const searchResults = await findSearchResults();
      expect(searchResults).toHaveLength(20);
      expectNoResultsElements();
    });
  });

  describe('Document Library Categories', () => {
    beforeEach(() => {
      mockUseDecision.mockReturnValue([{ variationKey: 'variation_2' }]);
    });

    it('renders popular documents list', async () => {
      await renderDocumentLibrary(expectedInitialProps);
      expectPopularDocumentsList();
    });

    it('redirects to the proper link on category title click', async () => {
      const category = 'tax';
      await renderDocumentLibrary(expectedInitialProps);
      expectPopularDocumentsList();
      clickSeeAllCategoryButton(category);
      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: '/document-library',
        query: { category },
      });
    });

    it('fires tracking on "See All <category> click"', async () => {
      await renderDocumentLibrary(expectedInitialProps);
      expectPopularDocumentsList();
      clickSeeAllCategoryButton('real estate');
      expectSignedInTracking({
        action: 'See All real estate',
        category: 'Document Library',
      });
    });

    it('redirects to the proper link on back link click', async () => {
      const category = 'tax';
      mockUseRouter.mockImplementation(() => ({
        ...mockRouter,
        query: { category },
      }));
      await renderDocumentLibrary(expectedInitialProps);
      exceptDocumentLibraryResultsHeading();
      clickBackToList();
      expect(mockRouterPush).toHaveBeenCalledWith(
        {
          pathname: '/document-library',
          query: {},
        },
        undefined,
        { shallow: true }
      );
    });

    it('fires tracking on back link click', async () => {
      const category = 'tax';
      mockUseRouter.mockImplementation(() => ({
        ...mockRouter,
        query: { category },
      }));
      await renderDocumentLibrary(expectedInitialProps);
      exceptDocumentLibraryResultsHeading();
      clickBackToList();
      expectSignedInTracking({
        action: 'Back to Popular Documents',
        category: 'Document Library',
      });
    });

    it('shows the Create All Documents heading by default', async () => {
      await renderDocumentLibrary(expectedInitialProps);
      screen.getByText('Create All Documents');
    });

    it('shows the Create <category> Documents heading when a category is selected', async () => {
      const category = 'tax';
      mockUseRouter.mockImplementation(() => ({
        ...mockRouter,
        query: { category },
      }));
      await renderDocumentLibrary(expectedInitialProps);
      await screen.findByText('Create tax Documents');
    });

    it('shows the Top Matches heading on search', async () => {
      await renderDocumentLibrary(expectedInitialProps);
      await typeIntoSearchInput('affidavit');
      clickSearchButton();
      await screen.findByText('Top Matches');
    });

    it('renders documents names with correct links', async () => {
      await renderDocumentLibrary(expectedInitialProps);
      expectLinkToStaticBuilder('1099-misc-efile-2021');
      expectLinkToFreewriteBuilder('w9-2018');
    });

    it('fires tracking on Popular Documents link', async () => {
      await renderDocumentLibrary(expectedInitialProps);
      void clickPopularDocumentsBuilderLink('employee-paystub');
      expectSignedInTracking({
        action: `Create Document | employee-paystub`,
        category: 'Document Library',
      });
    });

    it('renders counts of documents for each category', async () => {
      await renderDocumentLibraryWithDocumentCount(expectedInitialProps);
      expectCountOfCategoryDocuments('tax', 2);
      expectCountOfCategoryDocuments('business', 1);
      expectCountOfCategoryDocuments('personal', 1);
      expectCountOfCategoryDocuments('real estate', 1);
    });
  });
});
