import { get } from 'lodash';

import 'calypso/state/domains/init';

/**
 * Return a boolean value indicating whether requesting WHOIS details is in progress.
 *
 * @param  {Object} state	Global state tree
 * @param  {string} domain	the domain in question
 * @returns {boolean} If the request is in progress
 */
export default function isRequestingWhois( state, domain ) {
	return get( state, [ 'domains', 'management', 'isRequestingWhois', domain ], false );
}
