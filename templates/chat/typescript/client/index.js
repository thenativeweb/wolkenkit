'use strict';

/* global window */

const Chat = {
  data () {
    return {
      messages: [
        { user: 'goloroden', text: 'Hey', timestamp: new Date(), likes: 0 },
        { user: 'goloroden', text: 'Hallo Welt', timestamp: new Date(), likes: 0 }
      ],
      newMessage: ''
    };
  },

  mounted () {
    this.$refs.newMessage.focus();
  },

  watch: {
    messages: {
      deep: true,

      handler () {
        const lastMessage = this.$refs.messages.lastElementChild;

        lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  },

  methods: {
    toTime (timestamp) {
      return timestamp.toLocaleTimeString('en-US');
    },

    likeMessage (message) {
      // eslint-disable-next-line no-param-reassign
      message.likes += 1;
    },

    sendMessage () {
      if (this.newMessage.trim() === '') {
        this.newMessage = '';

        return;
      }

      this.messages.push({
        user: 'goloroden',
        text: this.newMessage,
        timestamp: new Date(),
        likes: 0
      });
      this.newMessage = '';
    }
  }
};

window.Vue.createApp(Chat).mount('main');
