import classNames from 'classnames';
import { debounce } from 'lodash';
import React, { useRef, useCallback } from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

import LoadGap from 'soapbox/components/load_gap';
import ScrollableList from 'soapbox/components/scrollable_list';
import TimelineQueueButtonHeader from 'soapbox/components/timeline_queue_button_header';
import StatusContainer from 'soapbox/containers/status_container';
import PlaceholderStatus from 'soapbox/features/placeholder/components/placeholder_status';
import PendingStatus from 'soapbox/features/ui/components/pending_status';

import type {
  Map as ImmutableMap,
  OrderedSet as ImmutableOrderedSet,
} from 'immutable';
import type { VirtuosoHandle } from 'react-virtuoso';
import type { IScrollableList } from 'soapbox/components/scrollable_list';

const messages = defineMessages({
  queue: { id: 'status_list.queue_label', defaultMessage: 'Click to see {count} new {count, plural, one {post} other {posts}}' },
});

interface IStatusList extends Omit<IScrollableList, 'onLoadMore' | 'children'> {
  scrollKey: string,
  statusIds: ImmutableOrderedSet<string>,
  lastStatusId?: string,
  featuredStatusIds?: ImmutableOrderedSet<string>,
  onLoadMore?: (lastStatusId: string) => void,
  isLoading: boolean,
  isPartial?: boolean,
  hasMore: boolean,
  prepend?: React.ReactNode,
  emptyMessage: React.ReactNode,
  alwaysPrepend?: boolean,
  timelineId?: string,
  queuedItemSize?: number,
  onDequeueTimeline?: (timelineId: string) => void,
  totalQueuedItemsCount?: number,
  group?: ImmutableMap<string, any>,
  withGroupAdmin?: boolean,
  onScrollToTop?: () => void,
  onScroll?: () => void,
  divideType: 'space' | 'border',
}

const StatusList: React.FC<IStatusList> = ({
  statusIds,
  lastStatusId,
  featuredStatusIds,
  divideType = 'border',
  onLoadMore,
  timelineId,
  totalQueuedItemsCount,
  onDequeueTimeline,
  isLoading,
  isPartial,
  withGroupAdmin,
  group,
  ...other
}) => {
  const node = useRef<VirtuosoHandle>(null);

  const getFeaturedStatusCount = () => {
    return featuredStatusIds?.size || 0;
  };

  const getCurrentStatusIndex = (id: string, featured: boolean): number => {
    if (featured) {
      return featuredStatusIds?.keySeq().findIndex(key => key === id) || 0;
    } else {
      return statusIds.keySeq().findIndex(key => key === id) + getFeaturedStatusCount();
    }
  };

  const handleMoveUp = (id: string, featured: boolean = false) => {
    const elementIndex = getCurrentStatusIndex(id, featured) - 1;
    selectChild(elementIndex);
  };

  const handleMoveDown = (id: string, featured: boolean = false) => {
    const elementIndex = getCurrentStatusIndex(id, featured) + 1;
    selectChild(elementIndex);
  };

  const handleLoadOlder = useCallback(debounce(() => {
    const loadMoreID = lastStatusId || statusIds.last();
    if (onLoadMore && loadMoreID) {
      onLoadMore(loadMoreID);
    }
  }, 300, { leading: true }), []);

  const selectChild = (index: number) => {
    node.current?.scrollIntoView({
      index,
      behavior: 'smooth',
      done: () => {
        const element: HTMLElement | null = document.querySelector(`#status-list [data-index="${index}"] .focusable`);
        element?.focus();
      },
    });
  };

  const handleDequeueTimeline = () => {
    if (!onDequeueTimeline || !timelineId) return;
    onDequeueTimeline(timelineId);
  };

  const renderLoadGap = (index: number) => {
    const ids = statusIds.toList();
    const nextId = ids.get(index + 1);
    const prevId = ids.get(index - 1);

    if (index < 1 || !nextId || !prevId || !onLoadMore) return null;

    return (
      <LoadGap
        key={'gap:' + nextId}
        disabled={isLoading}
        maxId={prevId!}
        onClick={onLoadMore}
      />
    );
  };

  const renderStatus = (statusId: string) => {
    return (
      // @ts-ignore
      <StatusContainer
        key={statusId}
        id={statusId}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        contextType={timelineId}
      />
    );
  };

  const renderPendingStatus = (statusId: string) => {
    const idempotencyKey = statusId.replace(/^末pending-/, '');

    return (
      <PendingStatus
        key={statusId}
        idempotencyKey={idempotencyKey}
      />
    );
  };

  const renderFeaturedStatuses = (): React.ReactNode[] => {
    if (!featuredStatusIds) return [];

    return featuredStatusIds.toArray().map(statusId => (
      // @ts-ignore
      <StatusContainer
        key={`f-${statusId}`}
        id={statusId}
        featured
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        contextType={timelineId}
      />
    ));
  };

  const renderStatuses = (): React.ReactNode[] => {
    if (isLoading || statusIds.size > 0) {
      return statusIds.toArray().map((statusId, index) => {
        if (statusId === null) {
          return renderLoadGap(index);
        } else if (statusId.startsWith('末pending-')) {
          return renderPendingStatus(statusId);
        } else {
          return renderStatus(statusId);
        }
      });
    } else {
      return [];
    }
  };

  const renderScrollableContent = () => {
    const featuredStatuses = renderFeaturedStatuses();
    const statuses = renderStatuses();

    if (featuredStatuses && statuses) {
      return featuredStatuses.concat(statuses);
    } else {
      return statuses;
    }
  };

  if (isPartial) {
    return (
      <div className='regeneration-indicator'>
        <div>
          <div className='regeneration-indicator__label'>
            <FormattedMessage id='regeneration_indicator.label' tagName='strong' defaultMessage='Loading&hellip;' />
            <FormattedMessage id='regeneration_indicator.sublabel' defaultMessage='Your home feed is being prepared!' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TimelineQueueButtonHeader
        key='timeline-queue-button-header'
        onClick={handleDequeueTimeline}
        count={totalQueuedItemsCount}
        message={messages.queue}
      />
      <ScrollableList
        id='status-list'
        key='scrollable-list'
        isLoading={isLoading}
        showLoading={isLoading && statusIds.size === 0}
        onLoadMore={handleLoadOlder}
        placeholderComponent={PlaceholderStatus}
        placeholderCount={20}
        ref={node}
        className={classNames('divide-y divide-solid divide-gray-200 dark:divide-slate-700', {
          'divide-none': divideType !== 'border',
        })}
        itemClassName={classNames({
          'pb-3': divideType !== 'border',
        })}
        {...other}
      >
        {renderScrollableContent()}
      </ScrollableList>,
    </>
  );
};

export default StatusList;
