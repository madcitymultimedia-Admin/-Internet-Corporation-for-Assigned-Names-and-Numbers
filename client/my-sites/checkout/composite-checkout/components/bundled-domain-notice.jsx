import { isMonthly, getPlan, getBillingMonthsForTerm } from '@automattic/calypso-products';
import { localizeUrl, translationExists } from '@automattic/i18n-utils';
import { translate } from 'i18n-calypso';
import {
	hasDomainRegistration,
	hasPlan,
	hasJetpackPlan,
	isNextDomainFree,
	hasP2PlusPlan,
} from 'calypso/lib/cart-values/cart-items';
import { REGISTER_DOMAIN } from 'calypso/lib/url/support';
import CheckoutTermsItem from 'calypso/my-sites/checkout/composite-checkout/components/checkout-terms-item';

/* eslint-disable wpcalypso/jsx-classname-namespace */

function getBillingMonthsForPlan( cart ) {
	const plans = cart.products
		.map( ( { product_slug } ) => getPlan( product_slug ) )
		.filter( Boolean );
	const plan = plans?.[ 0 ];

	try {
		return getBillingMonthsForTerm( plan?.term );
	} catch ( e ) {
		return 0;
	}
}

function hasBiennialPlan( cart ) {
	return getBillingMonthsForPlan( cart ) === 24;
}

function hasTriennialPlan( cart ) {
	return getBillingMonthsForPlan( cart ) === 36;
}

function hasMonthlyPlan( cart ) {
	return cart.products.some( ( { product_slug } ) => isMonthly( product_slug ) );
}

function getCopyForBillingTerm( cart ) {
	if ( hasBiennialPlan( cart ) ) {
		return translate(
			'Purchasing a two-year subscription to a WordPress.com plan gives you two years of access to your plan’s features and one year of a custom domain name.'
		);
	}
	if ( hasTriennialPlan( cart ) ) {
		return translate(
			'Purchasing a three-year subscription to a WordPress.com plan gives you three years of access to your plan’s features and one year of a custom domain name.'
		);
	}
	return translate(
		'Purchasing a one-year subscription to a WordPress.com plan gives you one year of access to your plan’s features and one year of a custom domain name.'
	);
}

export default function BundledDomainNotice( { cart } ) {
	// A dotcom plan should exist.
	if (
		! hasPlan( cart ) ||
		hasJetpackPlan( cart ) ||
		hasMonthlyPlan( cart ) ||
		hasP2PlusPlan( cart )
	) {
		return null;
	}

	// The plan should bundle a free domain
	if ( ! isNextDomainFree( cart ) ) {
		return null;
	}

	// Hide non-translated text for non-English users.
	// TODO: the following lines of code should be removed once all translations are ready.
	if (
		! translationExists(
			'Purchasing a one-year subscription to a WordPress.com plan gives you one year of access to your plan’s features and one year of a custom domain name.'
		)
	) {
		return null;
	}

	const domainRegistrationLink = (
		<a href={ localizeUrl( REGISTER_DOMAIN ) } target="_blank" rel="noopener noreferrer" />
	);

	const afterFirstYear = translate(
		'After the first year, you’ll continue to have access to your WordPress.com plan features but will need to renew the domain name.',
		{
			comment: 'After the first year of the bundled domain...',
		}
	);
	const registrationLink = translate(
		'To select your custom domain, follow {{domainRegistrationLink}}the registration instructions{{/domainRegistrationLink}}.',
		{
			comment:
				'The custom domain here is a free bundled domain. "To select" can be replaced with "to register" or "to claim".',
			components: {
				domainRegistrationLink,
			},
		}
	);

	return (
		<CheckoutTermsItem>
			{ getCopyForBillingTerm( cart ) } { hasDomainRegistration( cart ) ? null : registrationLink }{ ' ' }
			{ hasBiennialPlan( cart ) ? afterFirstYear : null }
		</CheckoutTermsItem>
	);
}
