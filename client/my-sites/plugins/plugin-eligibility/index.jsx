import { localize } from 'i18n-calypso';
import page from 'page';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import EligibilityWarnings from 'calypso/blocks/eligibility-warnings';
import HeaderCake from 'calypso/components/header-cake';
import MainComponent from 'calypso/components/main';
import PageViewTracker from 'calypso/lib/analytics/page-view-tracker';
import { initiateThemeTransfer } from 'calypso/state/themes/actions';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';

class PluginEligibility extends Component {
	static propTypes = {
		pluginSlug: PropTypes.string,
		siteId: PropTypes.number,
		siteSlug: PropTypes.string,
		translate: PropTypes.func,
		navigateTo: PropTypes.func,
		initiateTransfer: PropTypes.func,
	};

	getBackUrl = () => {
		const { pluginSlug, siteSlug } = this.props;

		return `/plugins/${ pluginSlug }/${ siteSlug }`;
	};

	goBack = () => this.props.navigateTo( this.getBackUrl() );

	pluginTransferInitiate = () => {
		// Use theme transfer action until we introduce generic ones that will handle both plugins and themes
		this.props.initiateTransfer(
			this.props.siteId,
			null,
			this.props.pluginSlug,
			'',
			'plugin_install'
		);
		this.goBack();
	};

	render() {
		const { translate } = this.props;

		return (
			<MainComponent>
				<PageViewTracker path="/plugins/:plugin/eligibility/:site" title="Plugins > Eligibility" />
				<HeaderCake isCompact={ true } onClick={ this.goBack }>
					{ translate( 'Install plugin' ) }
				</HeaderCake>
				<EligibilityWarnings
					onProceed={ this.pluginTransferInitiate }
					backUrl={ this.getBackUrl() }
				/>
			</MainComponent>
		);
	}
}

// It was 2:45AM, I wanted to deploy, and @dmsnell made me do it... props to @dmsnell :)
const withNavigation = ( WrappedComponent ) => ( props ) =>
	<WrappedComponent { ...{ ...props, navigateTo: page } } />;

const mapStateToProps = ( state ) => {
	const siteId = getSelectedSiteId( state );

	return {
		siteId,
	};
};

const mapDispatchToProps = {
	initiateTransfer: initiateThemeTransfer,
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)( withNavigation( localize( PluginEligibility ) ) );
