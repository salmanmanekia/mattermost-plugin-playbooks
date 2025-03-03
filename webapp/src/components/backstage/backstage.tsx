// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect} from 'react';
import {Switch, Route, NavLink, useLocation, useRouteMatch, matchPath} from 'react-router-dom';
import {useSelector} from 'react-redux';
import {useIntl} from 'react-intl';
import styled, {css} from 'styled-components';
import Icon from '@mdi/react';
import {mdiThumbsUpDown, mdiClipboardPlayMultipleOutline} from '@mdi/js';

import {GlobalState} from '@mattermost/types/store';
import {getMyTeams} from 'mattermost-redux/selectors/entities/teams';
import {Team} from '@mattermost/types/teams';
import {Theme} from '@mattermost/types/themes';
import {getTheme} from 'mattermost-redux/selectors/entities/preferences';

import {BookOutlineIcon} from '@mattermost/compass-icons/components';

import {promptForFeedback} from 'src/client';
import {useForceDocumentTitle} from 'src/hooks';
import CloudModal from 'src/components/cloud_modal';
import {BackstageNavbar} from 'src/components/backstage/backstage_navbar';
import {applyTheme} from 'src/components/backstage/css_utils';

import {ToastProvider} from './toast_banner';
import LHSNavigation from './lhs_navigation';
import MainBody from './main_body';

const BackstageContainer = styled.div`
    background: var(--center-channel-bg);
    overflow-y: auto;
    height: 100%;
`;

const BackstageTitlebarItem = styled(NavLink)`
    && {
        font-size: 16px;
        cursor: pointer;
        color: rgba(var(--center-channel-color-rgb), 0.80);
        fill: rgba(var(--center-channel-color-rgb), 0.80);
        padding: 0 12px;
        margin-right: 20px;
        display: flex;
        align-items: center;
        height: 40px;
        border-radius: 4px;
        border: 0px;

        &:hover {
            text-decoration: unset;
            color: rgba(var(--center-channel-color-rgb), 0.80);
            fill: rgba(var(--center-channel-color-rgb), 0.80);
            background: rgba(var(--center-channel-color-rgb), 0.08);
        }

        &.active {
            color: var(--button-bg);
            fill: var(--button-bg);
            text-decoration: unset;
            background: rgba(var(--button-bg-rgb), 0.08);
        }

        & > :first-child {
            margin-right: 12px;
        }
    }
`;

const Backstage = () => {
    const {pathname} = useLocation();
    const {url} = useRouteMatch();
    const noContainerScroll = matchPath<{playbookRunId?: string; playbookId?: string;}>(pathname, {
        path: [`${url}/runs/:playbookRunId`],
    });

    const currentTheme = useSelector<GlobalState, Theme>(getTheme);
    useEffect(() => {
        // This class, critical for all the styling to work, is added by ChannelController,
        // which is not loaded when rendering this root component.
        document.body.classList.add('app__body');
        const root = document.getElementById('root');
        if (root) {
            root.className += ' channel-view';
        }

        applyTheme(currentTheme);
        return function cleanUp() {
            document.body.classList.remove('app__body');
        };
    }, [currentTheme]);

    useForceDocumentTitle('Playbooks');

    return (
        <BackstageContainer id={BackstageID}>
            <ToastProvider>
                <MainContainer noContainerScroll={Boolean(noContainerScroll)}>
                    <LHSNavigation/>
                    <MainBody/>
                </MainContainer>
                <CloudModal/>
            </ToastProvider>
        </BackstageContainer>
    );
};

const MainContainer = styled.div<{noContainerScroll: boolean}>`
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: max-content auto;
    ${({noContainerScroll}) => (noContainerScroll ? css`
        height: 100%;
    ` : css`
        min-height: 100%;
    `)}
`;

const Navbar = () => {
    const {formatMessage} = useIntl();
    const match = useRouteMatch();
    const teams = useSelector<GlobalState, Team[]>(getMyTeams);

    //@ts-ignore plugins state is a thing
    const npsAvailable = useSelector<GlobalState, boolean>((state) => Boolean(state.plugins?.plugins?.['com.mattermost.nps']));

    return (
        <Switch>
            <Route path={`${match.url}/error`}/>
            <Route path={`${match.url}/start`}/>
            <Route path={`${match.url}/playbooks/:playbookId`}/>
            <Route path={`${match.url}/runs/:playbookRunId`}/>
            <Route>
                <BackstageNavbar className='flex justify-content-between'>
                    <div className='d-flex items-center'>
                        <BackstageTitlebarItem
                            to={`${match.url}/runs`}
                            activeClassName={'active'}
                            data-testid='playbookRunsLHSButton'
                        >
                            <Icon
                                path={mdiClipboardPlayMultipleOutline}
                                title={formatMessage({defaultMessage: 'Runs'})}
                                size={1.4}
                            />
                            {formatMessage({defaultMessage: 'Runs'})}
                        </BackstageTitlebarItem>
                        <BackstageTitlebarItem
                            to={`${match.url}/playbooks`}
                            activeClassName={'active'}
                            data-testid='playbooksLHSButton'
                        >
                            <BookOutlineIcon/>
                            {formatMessage({defaultMessage: 'Playbooks'})}
                        </BackstageTitlebarItem>
                    </div>
                    <div className='d-flex items-center'>
                        {npsAvailable && (
                            <BackstageTitlebarItem
                                onClick={promptForFeedback}
                                to={`/${teams[0].name}/messages/@feedbackbot`}
                                data-testid='giveFeedbackButton'
                            >
                                <Icon
                                    path={mdiThumbsUpDown}
                                    title={formatMessage({defaultMessage: 'Give Feedback'})}
                                    size={1}
                                />
                                {formatMessage({defaultMessage: 'Give Feedback'})}
                            </BackstageTitlebarItem>
                        )}
                    </div>
                </BackstageNavbar>
            </Route>
        </Switch>
    );
};

export const BackstageID = 'playbooks-backstageRoot';

export default Backstage;

