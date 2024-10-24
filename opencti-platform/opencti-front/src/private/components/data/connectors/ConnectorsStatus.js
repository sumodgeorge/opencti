import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import {
  ascend, compose, descend, prop, sortWith,
} from 'ramda';
import { interval } from 'rxjs';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles/index';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import { createRefetchContainer } from 'react-relay';
import { ArrowDropDown, ArrowDropUp, Extension } from '@material-ui/icons';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import List from '@material-ui/core/List';
import Tooltip from '@material-ui/core/Tooltip';
import { RotateLeft, Delete } from 'mdi-material-ui';
import IconButton from '@material-ui/core/IconButton';
import { Link } from 'react-router-dom';
import { FIVE_SECONDS } from '../../../../utils/Time';
import inject18n from '../../../../components/i18n';
import { commitMutation, MESSAGING$ } from '../../../../relay/environment';
import Security, { MODULES_MODMANAGE } from '../../../../utils/Security';
import {
  connectorDeletionMutation,
  connectorResetStateMutation,
} from './Connector';

const interval$ = interval(FIVE_SECONDS);

const styles = (theme) => ({
  linesContainer: {
    marginTop: 10,
  },
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
  bodyItem: {
    height: '100%',
    fontSize: 13,
  },
  itemIcon: {
    color: theme.palette.primary.main,
  },
  goIcon: {
    position: 'absolute',
    right: -10,
  },
  inputLabel: {
    float: 'left',
  },
  sortIcon: {
    float: 'left',
    margin: '-5px 0 0 15px',
  },
  icon: {
    color: theme.palette.primary.main,
  },
});

const inlineStylesHeaders = {
  iconSort: {
    position: 'absolute',
    margin: '0 0 0 5px',
    padding: 0,
    top: '0px',
  },
  name: {
    float: 'left',
    width: '40%',
    fontSize: 12,
    fontWeight: '700',
  },
  connector_type: {
    float: 'left',
    width: '30%',
    fontSize: 12,
    fontWeight: '700',
  },
  updated_at: {
    float: 'left',
    fontSize: 12,
    fontWeight: '700',
  },
};

const inlineStyles = {
  name: {
    float: 'left',
    width: '40%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  connector_type: {
    float: 'left',
    width: '30%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  updated_at: {
    float: 'left',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

class ConnectorsStatusComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { sortBy: 'name', orderAsc: true };
  }

  componentDidMount() {
    this.subscription = interval$.subscribe(() => {
      this.props.relay.refetch();
    });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  handleResetState(connectorId) {
    commitMutation({
      mutation: connectorResetStateMutation,
      variables: {
        id: connectorId,
      },
      onCompleted: () => {
        MESSAGING$.notifySuccess('The connector state has been reset');
      },
    });
  }

  handleDelete(connectorId) {
    commitMutation({
      mutation: connectorDeletionMutation,
      variables: {
        id: connectorId,
      },
      onCompleted: () => {
        MESSAGING$.notifySuccess('The connector has been cleared');
      },
    });
  }

  reverseBy(field) {
    this.setState({ sortBy: field, orderAsc: !this.state.orderAsc });
  }

  SortHeader(field, label, isSortable) {
    const { t } = this.props;
    const sortComponent = this.state.orderAsc ? (
      <ArrowDropDown style={inlineStylesHeaders.iconSort} />
    ) : (
      <ArrowDropUp style={inlineStylesHeaders.iconSort} />
    );
    if (isSortable) {
      return (
        <div
          style={inlineStylesHeaders[field]}
          onClick={this.reverseBy.bind(this, field)}
        >
          <span>{t(label)}</span>
          {this.state.sortBy === field ? sortComponent : ''}
        </div>
      );
    }
    return (
      <div style={inlineStylesHeaders[field]}>
        <span>{t(label)}</span>
      </div>
    );
  }

  render() {
    const {
      classes, t, nsdt, data,
    } = this.props;
    const sort = sortWith(
      this.state.orderAsc
        ? [ascend(prop(this.state.sortBy))]
        : [descend(prop(this.state.sortBy))],
    );
    const sortedConnectors = sort(data.connectors);
    return (
      <Card>
        <CardHeader
          avatar={<Extension className={classes.icon} />}
          title={t('Registered connectors')}
          style={{ paddingBottom: 0 }}
        />
        <CardContent style={{ paddingTop: 0 }}>
          <List classes={{ root: classes.linesContainer }}>
            <ListItem
              classes={{ root: classes.itemHead }}
              divider={false}
              style={{ paddingTop: 0 }}
            >
              <ListItemIcon>
                <span
                  style={{
                    padding: '0 8px 0 8px',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  #
                </span>
              </ListItemIcon>
              <ListItemText
                primary={
                  <div>
                    {this.SortHeader('name', 'Name', true)}
                    {this.SortHeader('connector_type', 'Type', true)}
                    {this.SortHeader('updated_at', 'Modified', true)}
                  </div>
                }
              />
              <ListItemSecondaryAction> &nbsp; </ListItemSecondaryAction>
            </ListItem>
            {sortedConnectors.map((connector) => (
              <ListItem
                key={connector.id}
                classes={{ root: classes.item }}
                divider={true}
                button={true}
                component={Link}
                to={`/dashboard/data/connectors/${connector.id}`}
              >
                <ListItemIcon
                  style={{ color: connector.active ? '#4caf50' : '#f44336' }}
                >
                  <Extension />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <div>
                      <div
                        className={classes.bodyItem}
                        style={inlineStyles.name}
                      >
                        {connector.name}
                      </div>
                      <div
                        className={classes.bodyItem}
                        style={inlineStyles.connector_type}
                      >
                        {connector.connector_type === 'INTERNAL_ENRICHMENT'
                          ? `${t(connector.connector_type)} (${t('auto:')} ${t(
                            connector.auto.toString(),
                          )})`
                          : t(connector.connector_type)}
                      </div>
                      <div
                        className={classes.bodyItem}
                        style={inlineStyles.updated_at}
                      >
                        {nsdt(connector.updated_at)}
                      </div>
                    </div>
                  }
                />
                <ListItemSecondaryAction>
                  <Security needs={[MODULES_MODMANAGE]}>
                    <Tooltip title={t('Reset the connector state')}>
                      <IconButton
                        onClick={this.handleResetState.bind(this, connector.id)}
                        aria-haspopup="true"
                        color="primary"
                      >
                        <RotateLeft />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('Clear this connector')}>
                      <IconButton
                        onClick={this.handleDelete.bind(this, connector.id)}
                        aria-haspopup="true"
                        color="primary"
                        disabled={connector.active}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Security>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }
}

ConnectorsStatusComponent.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  nsdt: PropTypes.func,
  data: PropTypes.object,
};

export const connectorsStatusQuery = graphql`
  query ConnectorsStatusQuery {
    ...ConnectorsStatus_data
  }
`;

const ConnectorsStatus = createRefetchContainer(
  ConnectorsStatusComponent,
  {
    data: graphql`
      fragment ConnectorsStatus_data on Query {
        connectors {
          id
          name
          active
          auto
          connector_type
          connector_scope
          updated_at
        }
      }
    `,
  },
  connectorsStatusQuery,
);

export default compose(inject18n, withStyles(styles))(ConnectorsStatus);
