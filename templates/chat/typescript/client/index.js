'use strict';

/* global window */

const Chat = {
  setup () {
    const wolkenkit = new window.Wolkenkit();

    const messages = window.Vue.ref(null);
    const newMessage = window.Vue.ref(null);

    const state = window.Vue.reactive({
      messages: [],
      newMessage: '',
      error: null
    });

    const showError = function ({ title, details }) {
      state.error = { title, details };
      setTimeout(() => {
        state.error = null;
      }, 5000);
    };

    const toTime = function (timestamp) {
      return timestamp.toLocaleTimeString('en-US');
    };

    const sendMessage = async function () {
      if (state.newMessage.trim() === '') {
        state.newMessage = '';

        return;
      }

      try {
        await wolkenkit.issueCommand({
          contextIdentifier: { name: 'communication' },
          aggregateIdentifier: { name: 'message' },
          name: 'send',
          data: { text: state.newMessage }
        });
      } catch (ex) {
        return showError({ title: 'Failed to send message.', details: ex.message });
      }

      state.newMessage = '';
    };

    const likeMessage = async function (aggregateId) {
      try {
        await wolkenkit.issueCommand({
          contextIdentifier: { name: 'communication' },
          aggregateIdentifier: { name: 'message', id: aggregateId },
          name: 'like',
          data: {}
        });
      } catch (ex) {
        return showError({ title: 'Failed to like message.', details: ex.message });
      }
    };

    window.Vue.watchEffect(() => {
      if (!messages.value) {
        return;
      }

      const lastMessage = messages.value.lastElementChild;

      lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

    window.Vue.onMounted(async () => {
      for await (const row of await wolkenkit.queryView({ viewName: 'messages', queryName: 'all' })) {
        state.messages.unshift({
          id: row.id,
          user: 'anonymous',
          timestamp: new Date(row.timestamp),
          text: row.text,
          likes: row.likes
        });
      }

      window.Vue.nextTick(() => {
        if (!messages.value) {
          return;
        }

        const lastMessage = messages.value?.lastElementChild;

        lastMessage.scrollIntoView({ behavior: 'auto', block: 'end' });
      });

      wolkenkit.observeDomainEvents(async domainEvent => {
        switch (domainEvent.name) {
          case 'sent': {
            state.messages.push({
              id: domainEvent.aggregateIdentifier.id,
              user: domainEvent.metadata.initiator.user.id,
              timestamp: new Date(domainEvent.metadata.timestamp),
              text: domainEvent.data.text,
              likes: 0
            });
            break;
          }
          case 'liked': {
            const index = state.messages.findIndex(
              row => row.id === domainEvent.aggregateIdentifier.id
            );

            if (index === -1) {
              return;
            }

            state.messages[index].likes = domainEvent.data.likes;
            break;
          }
          default: {
            // Intentionally ignore non-expected events.
          }
        }
      });

      newMessage.value.focus();
    });

    return {
      state,
      messages,
      newMessage,
      toTime,
      sendMessage,
      likeMessage
    };
  }
};

window.Vue.createApp(Chat).mount('#app');
