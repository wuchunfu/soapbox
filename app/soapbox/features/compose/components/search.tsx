import classNames from 'clsx';
import { Map as ImmutableMap } from 'immutable';
import debounce from 'lodash/debounce';
import React, { useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  changeSearch,
  clearSearch,
  setSearchAccount,
  showSearch,
  submitSearch,
} from 'soapbox/actions/search';
import AutosuggestAccountInput from 'soapbox/components/autosuggest_account_input';
import SvgIcon from 'soapbox/components/ui/icon/svg-icon';
import { useAppSelector } from 'soapbox/hooks';

const messages = defineMessages({
  placeholder: { id: 'search.placeholder', defaultMessage: 'Search' },
  action: { id: 'search.action', defaultMessage: 'Search for “{query}”' },
});

function redirectToAccount(accountId: string, routerHistory: any) {
  return (_dispatch: any, getState: () => ImmutableMap<string, any>) => {
    const acct = getState().getIn(['accounts', accountId, 'acct']);

    if (acct && routerHistory) {
      routerHistory.push(`/@${acct}`);
    }
  };
}

interface ISearch {
  autoFocus?: boolean,
  autoSubmit?: boolean,
  autosuggest?: boolean,
  openInRoute?: boolean
}

const Search = (props: ISearch) => {
  const {
    autoFocus = false,
    autoSubmit = false,
    autosuggest = false,
    openInRoute = false,
  } = props;

  const dispatch = useDispatch();
  const history = useHistory();
  const intl = useIntl();

  const value = useAppSelector((state) => state.search.value);
  const submitted = useAppSelector((state) => state.search.submitted);

  const debouncedSubmit = useCallback(debounce(() => {
    dispatch(submitSearch());
  }, 900), []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    dispatch(changeSearch(value));

    if (autoSubmit) {
      debouncedSubmit();
    }
  };

  const handleClear = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (value.length > 0 || submitted) {
      dispatch(clearSearch());
    }
  };

  const handleSubmit = () => {
    if (openInRoute) {
      dispatch(setSearchAccount(null));
      dispatch(submitSearch());

      history.push('/search');
    } else {
      dispatch(submitSearch());
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      handleSubmit();
    } else if (event.key === 'Escape') {
      document.querySelector('.ui')?.parentElement?.focus();
    }
  };

  const handleFocus = () => {
    dispatch(showSearch());
  };

  const handleSelected = (accountId: string) => {
    dispatch(clearSearch());
    dispatch(redirectToAccount(accountId, history));
  };

  const makeMenu = () => [
    {
      text: intl.formatMessage(messages.action, { query: value }),
      icon: require('@tabler/icons/search.svg'),
      action: handleSubmit,
    },
  ];

  const hasValue = value.length > 0 || submitted;
  const componentProps: any = {
    className: 'block w-full pl-3 pr-10 py-2 border border-gray-200 dark:border-gray-800 rounded-full leading-5 bg-gray-200 dark:bg-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm',
    type: 'text',
    id: 'search',
    placeholder: intl.formatMessage(messages.placeholder),
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    autoFocus: autoFocus,
  };

  if (autosuggest) {
    componentProps.onSelected = handleSelected;
    componentProps.menu = makeMenu();
    componentProps.autoSelect = false;
  }

  return (
    <div className='w-full'>
      <label htmlFor='search' className='sr-only'>{intl.formatMessage(messages.placeholder)}</label>

      <div className='relative'>
        {autosuggest ? (
          <AutosuggestAccountInput {...componentProps} />
        ) : (
          <input {...componentProps} />
        )}

        <div
          role='button'
          tabIndex={0}
          className='absolute inset-y-0 right-0 px-3 flex items-center cursor-pointer'
          onClick={handleClear}
        >
          <SvgIcon
            src={require('@tabler/icons/search.svg')}
            className={classNames('h-4 w-4 text-gray-600', { hidden: hasValue })}
          />

          <SvgIcon
            src={require('@tabler/icons/x.svg')}
            className={classNames('h-4 w-4 text-gray-600', { hidden: !hasValue })}
            aria-label={intl.formatMessage(messages.placeholder)}
          />
        </div>
      </div>
    </div>
  );
};

export default Search;
