import React, { useRef } from 'react';

import { Avatar, HStack, Icon, Stack, Text } from 'soapbox/components/ui';
import VerificationBadge from 'soapbox/components/verification_badge';
import { useChatContext } from 'soapbox/contexts/chat-context';

import ChatBox from './chat-box';
import ChatPaneHeader from './chat-pane-header';
import ChatSettings from './chat-settings';

/** Floating desktop chat window. */
const ChatWindow = () => {
  const { chat, setChat, isOpen, isEditing, needsAcceptance, setEditing, toggleChatPane } = useChatContext();

  const inputRef = useRef<HTMLTextAreaElement>();

  const closeChat = () => setChat(null);

  const openAndFocusChat = () => {
    toggleChatPane();
    inputRef.current?.focus();
  };

  const openChatSettings = () => setEditing(true);

  const secondaryAction = () => {
    if (needsAcceptance) {
      return undefined;
    }

    return isOpen ? openChatSettings : openAndFocusChat;
  };

  if (!chat) return null;

  if (isEditing) {
    return <ChatSettings />;
  }

  return (
    <>
      <ChatPaneHeader
        title={
          <HStack alignItems='center' space={2}>
            {isOpen && (
              <button onClick={closeChat}>
                <Icon
                  src={require('@tabler/icons/arrow-left.svg')}
                  className='h-6 w-6 text-gray-600 dark:text-gray-400'
                />
              </button>
            )}

            <HStack alignItems='center' space={3}>
              {isOpen && (
                <Avatar src={chat.account.avatar} size={40} />
              )}

              <Stack alignItems='start'>
                <div className='flex items-center space-x-1 flex-grow'>
                  <Text size='sm' weight='bold' truncate>{chat.account.display_name}</Text>
                  {chat.account.verified && <VerificationBadge />}
                </div>
                <Text size='sm' weight='medium' theme='primary' truncate>@{chat.account.acct}</Text>
              </Stack>
            </HStack>
          </HStack>
        }
        secondaryAction={secondaryAction()}
        secondaryActionIcon={isOpen ? require('@tabler/icons/info-circle.svg') : require('@tabler/icons/edit.svg')}
        isToggleable={!isOpen}
        isOpen={isOpen}
        onToggle={toggleChatPane}
      />

      <Stack className='overflow-hidden flex-grow h-full' space={2}>
        <ChatBox chat={chat} inputRef={inputRef as any} />
      </Stack>
    </>
  );
};

export default ChatWindow;
