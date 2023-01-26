import React from 'react';
import AutoMockedProvider from 'tests/utils/AutoMockedProvider';
import AutoMockedLoadingProvider from 'tests/utils/AutoMockedLoadingProvider';
import AutoMockedNetworkErrorProvider from 'tests/utils/AutoMockedNetworkErrorProvider';
import { RendererWithApollo } from './types';

/*
  Composable function used to conditionally wrap a component in an apollo provider
  @param renderer the renderer containing the optional apollo mocks
  @returns {function(*): function(*=): *} a method returning a react component
  conditionally wrapped in an apollo provider
*/
// eslint-disable-next-line react/display-name -- no need to name this component
export const renderWithApollo = <R extends RendererWithApollo>(renderer: R) => (
  component: JSX.Element
): JSX.Element => {
  const {
    isApolloNetworkError,
    isMockedApolloLoadingState,
    mocks,
    mutations,
    resolvers,
  } = renderer;
  if (!resolvers) {
    return component;
  }
  if (isMockedApolloLoadingState) {
    // Mocked provider allows us to easily test loading states
    return <AutoMockedLoadingProvider>{component}</AutoMockedLoadingProvider>;
  }
  if (isApolloNetworkError) {
    return (
      <AutoMockedNetworkErrorProvider>
        {component}
      </AutoMockedNetworkErrorProvider>
    );
  }
  return (
    <AutoMockedProvider
      mocks={mocks}
      mutations={mutations}
      resolvers={resolvers}
    >
      {component}
    </AutoMockedProvider>
  );
};

/*
  Composable function used to mock apollo network errors
  @param renderer the renderer containing the optional apollo mocks
  @returns { function(*): function(*=): *} a method returning modified renderer
    @param apolloNetworkError (string) the network error to throw
*/
export const withApolloNetworkError = <R extends RendererWithApollo>(
  originalRenderer: R
) => (): R => {
  const renderer = originalRenderer;
  renderer.resolvers = {};
  renderer.isApolloNetworkError = true;
  return renderer;
};

/*
  Composable function used to mock apollo loading state
  @param renderer the renderer set to mock the loading state
  @returns { function(*): function(*=): *} a method returning modified renderer
*/
export const withApolloLoadingState = <R extends RendererWithApollo>(
  originalRenderer: R
) => (): R => {
  const renderer = originalRenderer;
  renderer.resolvers = {};
  renderer.isMockedApolloLoadingState = true;
  return renderer;
};

/*
  Composable function used to conditionally create apollo mocks
  @param originalRenderer the renderer to attach the apollo mocks
  @param resolvers an object containing resolvers to mock
  @param mutations an object containing mutations to mock
    a mutation stub should look something like:
        const mutationStub = sinon.stub().returns({ ok: true });
        <mutationName>: (mutation, { var1, var2, ... }) => (
          mutationStub(var1, var2, ...)
        ),
  @returns {function(*): function(*=): *} a new renderer with a apollo mocks
*/
const withApollo = <R extends RendererWithApollo>(originalRenderer: R) => (
  resolvers: unknown = {},
  mutations: unknown = {},
  mocks: unknown = {}
): R => {
  const renderer = originalRenderer;
  renderer.resolvers = resolvers;
  renderer.mutations = mutations;
  renderer.mocks = mocks;

  // Reset loading and network error state
  renderer.isMockedApolloLoadingState = false;
  renderer.isApolloNetworkError = false;
  return renderer;
};
// If you see this ignore please consider refactoring to a named export
// eslint-disable-next-line import/no-default-export
export default withApollo;
