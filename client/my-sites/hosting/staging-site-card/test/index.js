/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { useAddStagingSiteMutation } from 'calypso/my-sites/hosting/staging-site-card/use-add-staging-site';
import { useCheckStagingSiteStatus } from 'calypso/my-sites/hosting/staging-site-card/use-check-staging-site-status';
import { useHasValidQuotaQuery } from 'calypso/my-sites/hosting/staging-site-card/use-has-valid-quota';
import { useStagingSite } from 'calypso/my-sites/hosting/staging-site-card/use-staging-site';
import { StagingSiteCard } from '..';

const addStagingSiteBtnName = 'Add staging site';
const manageStagingBtnName = 'Manage staging site';
const INITIAL_STATE = {
	sites: {
		items: {},
	},
};
const mockStore = configureStore();
const store = mockStore( INITIAL_STATE );

const mockUseDispatch = jest.fn();
jest.mock( 'react-redux', () => ( {
	__esModule: true,
	...jest.requireActual( 'react-redux' ),
	useDispatch: () => mockUseDispatch,
} ) );

jest.mock( '@tanstack/react-query', () => ( {
	__esModule: true,
	...jest.requireActual( '@tanstack/react-query' ),
	useQueryClient: () => ( {
		invalidateQueries: jest.fn(),
	} ),
} ) );

jest.mock( 'calypso/state/analytics/actions', () => ( {
	__esModule: true,
	...jest.requireActual( 'calypso/state/analytics/actions' ),
	recordTracksEvent: jest.fn(),
} ) );

jest.mock( 'calypso/my-sites/hosting/staging-site-card/use-add-staging-site', () => ( {
	__esModule: true,
	useAddStagingSiteMutation: jest.fn( () => {
		return {
			addStagingSite: jest.fn(),
			loading: false,
		};
	} ),
} ) );

jest.mock( 'calypso/my-sites/hosting/staging-site-card/use-has-valid-quota', () => ( {
	__esModule: true,
	useHasValidQuotaQuery: jest.fn( () => {
		return {
			data: true,
		};
	} ),
} ) );

jest.mock( 'calypso/my-sites/hosting/staging-site-card/use-delete-staging-site', () => ( {
	__esModule: true,
	useDeleteStagingSite: jest.fn( () => {
		return {
			deleteStagingSite: jest.fn(),
			isReverting: false,
		};
	} ),
} ) );

jest.mock( 'calypso/my-sites/hosting/staging-site-card/use-check-staging-site-status', () => ( {
	__esModule: true,
	useCheckStagingSiteStatus: jest.fn(),
} ) );

jest.mock( 'calypso/state/analytics/actions', () => ( {
	__esModule: true,
	recordTracksEvent: jest.fn(),
} ) );

jest.mock( 'calypso/my-sites/hosting/staging-site-card/use-staging-site', () => ( {
	__esModule: true,
	useStagingSite: jest.fn(),
} ) );

const defaultProps = {
	disabled: false,
	siteId: 1,
	translate: ( text ) => text,
};

describe( 'StagingSiteCard component', () => {
	beforeAll( () => {
		// Mock the missing `window.matchMedia` function that's not even in JSDOM
		Object.defineProperty( window, 'matchMedia', {
			writable: true,
			value: jest.fn().mockImplementation( ( query ) => ( {
				matches: false,
				media: query,
				onchange: null,
				addListener: jest.fn(), // deprecated
				removeListener: jest.fn(), // deprecated
				addEventListener: jest.fn(),
				removeEventListener: jest.fn(),
				dispatchEvent: jest.fn(),
			} ) ),
		} );
		jest.clearAllMocks();
	} );
	it( 'shows a loading state when we still loading.', () => {
		useStagingSite.mockReturnValue( { data: null, isLoading: true } );

		render(
			<Provider store={ store }>
				<StagingSiteCard { ...defaultProps } />
			</Provider>
		);
		expect( useStagingSite ).toHaveBeenCalledWith( defaultProps.siteId, {
			enabled: true,
			onError: expect.any( Function ),
		} );

		expect( screen.getByTestId( 'loading-placeholder' ) ).toBeInTheDocument();
	} );

	it( 'shows the add staging buttons, if we dont have any staging sites', () => {
		useStagingSite.mockReturnValue( { data: [], isLoading: false } );

		render(
			<Provider store={ store }>
				<StagingSiteCard { ...defaultProps } />
			</Provider>
		);

		expect( screen.getByText( addStagingSiteBtnName ) ).toBeVisible();
	} );

	it( 'shows the manage staging site button, in case we have one available', () => {
		useStagingSite.mockReturnValue( {
			data: [ { id: 2, url: 'https://staging.example.com', user_has_permission: true } ],
			isLoading: false,
		} );
		useCheckStagingSiteStatus.mockReturnValue( 'complete' );

		render(
			<Provider store={ store }>
				<StagingSiteCard { ...defaultProps } />
			</Provider>
		);

		expect( screen.getByText( manageStagingBtnName ) ).toBeVisible();
	} );

	it( 'shows transferring message when we creating a staging site', async () => {
		useStagingSite.mockReturnValue( {
			data: [ { id: 2, url: 'https://staging.example.com', user_has_permission: true } ],
			isLoading: false,
		} );

		const { rerender } = render(
			<Provider store={ store }>
				<StagingSiteCard { ...defaultProps } />
			</Provider>
		);

		expect( screen.queryByTestId( 'transferring-staging-content' ) ).not.toBeInTheDocument();
		useAddStagingSiteMutation.mockReturnValueOnce( {
			addStagingSite: jest.fn(),
			isLoading: true,
		} );
		rerender(
			<Provider store={ store }>
				<StagingSiteCard { ...defaultProps } />
			</Provider>
		);
		await waitFor( () =>
			expect( screen.getByTestId( 'transferring-staging-content' ) ).toBeVisible()
		);
	} );
	//
	it( 'shows quota exceeded error message', async () => {
		useStagingSite.mockReturnValue( { data: [], isLoading: false } );

		const { rerender } = render(
			<Provider store={ store }>
				<StagingSiteCard { ...defaultProps } />
			</Provider>
		);

		expect( screen.queryByTestId( 'quota-message' ) ).not.toBeInTheDocument();
		expect( screen.getByText( addStagingSiteBtnName ) ).not.toBeDisabled();
		useHasValidQuotaQuery.mockReturnValueOnce( { data: false } );
		rerender(
			<Provider store={ store }>
				<StagingSiteCard { ...defaultProps } />
			</Provider>
		);

		expect( screen.getByTestId( 'quota-message' ) ).toBeVisible();
	} );

	it( 'calls addStagingSite function when we press the add staging button', () => {
		useStagingSite.mockReturnValue( { data: [], isLoading: false } );
		useAddStagingSiteMutation.mockReturnValue( {
			addStagingSite: jest.fn(),
			isLoading: false,
		} );

		render(
			<Provider store={ store }>
				<StagingSiteCard { ...defaultProps } />
			</Provider>
		);

		fireEvent.click( screen.getByText( addStagingSiteBtnName ) );
		expect( useAddStagingSiteMutation().addStagingSite ).toHaveBeenCalled();

		expect( mockUseDispatch ).toHaveBeenCalled();
	} );

	it( 'show access site error', () => {
		useStagingSite.mockReturnValue( {
			data: [ { id: 2, url: 'https://staging.example.com', user_has_permission: false } ],
			isLoading: false,
		} );
		render(
			<Provider store={ store }>
				<StagingSiteCard { ...defaultProps } />
			</Provider>
		);
		expect( screen.queryByTestId( 'staging-sites-access-message' ) ).toBeVisible();
		expect( screen.queryByText( addStagingSiteBtnName ) ).not.toBeInTheDocument();
	} );
} );
